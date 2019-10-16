import 'reflect-metadata';
import { Container, injectable, inject } from 'inversify';
import { storage } from '../metadata/MetadataStorage';
import { Command } from './Command';
import { CommandRunner } from './CommandRunner';
import { Use, AfterCommand, BeforeCommand } from '../decorators';
import { Middleware } from 'src/utils/Middleware';

interface ClassTestState {
  calls: number;
  args: any[];
}

const initState = (): ClassTestState => ({
  calls: 0,
  args: []
});

const updateState = (obj: ClassTestState, args: any) => {
  obj.calls++;
  obj.args.push([...args]);
};

describe('CommandRunner', () => {
  beforeEach(() => {
    storage.clear();
  });

  test('simple command', async () => {
    class Simple implements Command {
      static state = {
        constructor: initState(),
        handle: initState()
      };

      constructor() {
        updateState(Simple.state.constructor, arguments);
      }

      async handle(event: any): Promise<any> {
        updateState(Simple.state.handle, arguments);

        return event;
      }
    }

    const runner = new CommandRunner();
    const event = {};
    expect(await runner.run(Simple, event)).toBe(event);
    expect(Simple.state.constructor.calls).toBe(1);
    expect(Simple.state.constructor.args).toStrictEqual([[]]);
    expect(Simple.state.handle.calls).toBe(1);
    expect(Simple.state.handle.args).toStrictEqual([[event]]);

    // make sure command was constructed once & handle was called a second time
    const event2 = {};
    expect(await runner.run(Simple, event2)).toBe(event2);
    expect(Simple.state.constructor.calls).toBe(1);
    expect(Simple.state.handle.calls).toBe(2);
  });

  test('single @AfterCommand() subscriber', async () => {
    class Command implements Command {
      static state = {
        constructor: initState(),
        handle: initState()
      };

      constructor() {
        updateState(Command.state.constructor, arguments);
      }

      async handle(event: any): Promise<any> {
        updateState(Command.state.handle, arguments);

        return event;
      }
    }

    class CommandSubscriber {
      static state = {
        constructor: initState(),
        onCommand: initState()
      };

      constructor() {
        updateState(CommandSubscriber.state.constructor, arguments);
      }

      @AfterCommand(Command)
      async onCommand(_result: boolean, _runner: CommandRunner): Promise<void> {
        updateState(CommandSubscriber.state.onCommand, arguments);
      }
    }

    const runner = new CommandRunner();
    const event = {};
    expect(await runner.run(Command, event)).toBe(event);
    expect(Command.state.constructor.calls).toBe(1);
    expect(Command.state.constructor.args).toEqual([[]]);
    expect(Command.state.handle.calls).toBe(1);
    expect(Command.state.handle.args).toStrictEqual([[event]]);
    expect(CommandSubscriber.state.constructor.calls).toBe(1);
    expect(CommandSubscriber.state.constructor.args).toEqual([[]]);
    expect(CommandSubscriber.state.onCommand.calls).toBe(1);
    expect(CommandSubscriber.state.onCommand.args).toStrictEqual([
      [event, runner]
    ]);
  });

  test('multiple @AfterCommand() subscribers with default priority', async () => {
    class Command implements Command {
      static state = {
        constructor: initState(),
        handle: initState()
      };

      constructor() {
        updateState(Command.state.constructor, arguments);
      }

      async handle(event: any): Promise<any> {
        updateState(Command.state.handle, arguments);

        return event;
      }
    }

    class CommandSubscriber1 {
      static state = {
        constructor: initState(),
        onCommand: initState()
      };

      constructor() {
        updateState(CommandSubscriber1.state.constructor, arguments);
      }

      @AfterCommand(Command)
      async onCommand(): Promise<void> {
        updateState(CommandSubscriber1.state.onCommand, arguments);
      }
    }

    class CommandSubscriber2 {
      static state = {
        constructor: initState(),
        onCommand: initState()
      };

      constructor() {
        updateState(CommandSubscriber2.state.constructor, arguments);
      }

      @AfterCommand(Command)
      async onCommand(): Promise<void> {
        updateState(CommandSubscriber2.state.onCommand, arguments);
      }
    }

    const runner = new CommandRunner();
    const event = {};
    expect(await runner.run(Command, event)).toBe(event);

    expect(Command.state.constructor.calls).toBe(1);
    expect(Command.state.constructor.args).toEqual([[]]);
    expect(Command.state.handle.calls).toBe(1);
    expect(Command.state.handle.args).toStrictEqual([[event]]);
    expect(CommandSubscriber1.state.constructor.calls).toBe(1);
    expect(CommandSubscriber1.state.constructor.args).toEqual([[]]);
    expect(CommandSubscriber1.state.onCommand.calls).toBe(1);
    expect(CommandSubscriber1.state.onCommand.args).toStrictEqual([
      [event, runner]
    ]);
    expect(CommandSubscriber2.state.constructor.calls).toBe(1);
    expect(CommandSubscriber2.state.constructor.args).toEqual([[]]);
    expect(CommandSubscriber2.state.onCommand.calls).toBe(1);
    expect(CommandSubscriber2.state.onCommand.args).toStrictEqual([
      [event, runner]
    ]);
  });

  test('@Use() gets called before command handler', async () => {
    class ValidateCommand implements Middleware {
      async use(_event: any): Promise<void> {
        throw new Error('Invalid Event');
      }
    }

    class MyCommand implements Command {
      @Use(ValidateCommand)
      async handle(event: any): Promise<boolean> {
        return event;
      }
    }

    const runner = new CommandRunner();
    await expect(runner.run(MyCommand, {})).rejects.toStrictEqual(
      new Error('Invalid Event')
    );
  });

  test('multiple @AfterCommand() subscribers with priority', async () => {
    const calls: string[] = [];
    class Command {
      async handle(event: any): Promise<boolean> {
        return event;
      }
    }

    // @ts-ignore
    class CommandSubscriber1 {
      @AfterCommand(Command, { priority: -1 })
      async onCommand(): Promise<void> {
        calls.push('CommandSubscriber1');
      }
    }

    // @ts-ignore
    class CommandSubscriber2 {
      @AfterCommand(Command) // priority 0 (default)
      async onCommand(): Promise<void> {
        calls.push('CommandSubscriber2');
      }
    }

    // @ts-ignore
    class CommandSubscriber3 {
      @AfterCommand(Command, { priority: 1 })
      async onCommand(): Promise<void> {
        calls.push('CommandSubscriber3');
      }
    }

    const runner = new CommandRunner();
    await runner.run(Command, {});
    expect(calls).toStrictEqual([
      'CommandSubscriber3',
      'CommandSubscriber2',
      'CommandSubscriber1'
    ]);
  });

  test('@BeforeCommand() and @AfterCommand() with multiple subscribers', async () => {
    const calls: { name: string; args: any[] }[] = [];

    class User {
      email: string;
    }

    class CreateUser implements Command {
      async handle(fields: Partial<User>): Promise<User> {
        calls.push({ name: 'CreateUser', args: [...arguments] });

        return Object.assign(new User(), { ...fields });
      }
    }

    class UserSubscribe implements Command {
      async handle(email: string): Promise<string> {
        calls.push({ name: 'UserSubscribe', args: [...arguments] });

        return email;
      }
    }

    class SendEmail implements Command {
      async handle(email: string): Promise<string> {
        calls.push({ name: 'SendEmail', args: [...arguments] });

        return email;
      }
    }

    // @ts-ignore
    class CreateUserSubscriber {
      @BeforeCommand(CreateUser)
      async lowercase(fields: Partial<User>): Promise<void> {
        const args = [...arguments];
        args[0] = { ...args[0] }; // clone args since we're mutating
        calls.push({ name: 'CreateUserSubscriber.lowercase', args });
        fields.email = fields.email.toLowerCase();
      }

      @AfterCommand(CreateUser)
      async onCreateUser(user: User, runner: CommandRunner): Promise<void> {
        calls.push({
          name: 'CreateUserSubscriber.onCreateUser',
          args: [...arguments]
        });
        await runner.run(UserSubscribe, user.email);
      }
    }

    // @ts-ignore
    class OnUserSubscribe {
      @AfterCommand(UserSubscribe)
      async onUserSubscribe(
        email: string,
        runner: CommandRunner
      ): Promise<void> {
        calls.push({ name: 'OnUserSubscribe', args: [...arguments] });

        await runner.run(SendEmail, email);
      }
    }

    const runner = new CommandRunner();
    const user = await runner.run(CreateUser, { email: 'JOHN@DOE.COM' });
    expect(user).toBeInstanceOf(User);
    expect(user).toStrictEqual(
      Object.assign(new User(), { email: 'john@doe.com' })
    );
    expect(calls).toStrictEqual([
      {
        name: 'CreateUserSubscriber.lowercase',
        args: [{ email: 'JOHN@DOE.COM' }, runner]
      },
      {
        name: 'CreateUser',
        args: [{ email: 'john@doe.com' }]
      },
      {
        name: 'CreateUserSubscriber.onCreateUser',
        args: [user, runner]
      },
      {
        name: 'UserSubscribe',
        args: ['john@doe.com']
      },
      {
        name: 'OnUserSubscribe',
        args: ['john@doe.com', runner]
      },
      {
        name: 'SendEmail',
        args: ['john@doe.com']
      }
    ]);
  });

  it('uses inversify Container for DI', async () => {
    class User {
      name: string;
    }

    const expected = new User();
    expected.name = 'John Doe';

    @injectable()
    class UserRepository {
      async getUser(): Promise<User> {
        return expected;
      }
    }

    const log = jest.fn();

    @injectable()
    class Logger {
      async log(msg: string): Promise<void> {
        log(msg);
      }
    }

    @injectable()
    class GetUserCommand {
      constructor(
        @inject(UserRepository) private userRepository: UserRepository
      ) {}

      async handle(): Promise<User> {
        return this.userRepository.getUser();
      }
    }

    @injectable()
    // @ts-ignore
    class OnGetUser {
      constructor(@inject(Logger) private logger: Logger) {}

      @AfterCommand(GetUserCommand)
      async onGetUser(user: User): Promise<void> {
        this.logger.log(`Hello, ${user.name}`);
      }
    }

    const container = new Container();
    container
      .bind(Logger)
      .toSelf()
      .inSingletonScope();
    container
      .bind(UserRepository)
      .toSelf()
      .inSingletonScope();
    container
      .bind(GetUserCommand)
      .toSelf()
      .inSingletonScope();
    container
      .bind(OnGetUser)
      .toSelf()
      .inSingletonScope();

    const runner = new CommandRunner({
      container
    });

    const result = await runner.run(GetUserCommand);

    expect(result).toBeInstanceOf(User);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('Hello, John Doe');
  });
});
