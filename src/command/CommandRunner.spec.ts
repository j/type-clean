import 'reflect-metadata';
import { storage } from '../metadata/MetadataStorage';
import { Command } from './Command';
import { CommandRunner } from './CommandRunner';
import { On } from '../decorators';

describe('CommandRunner', () => {
  beforeEach(() => {
    storage.clear();
  });

  test('runs simple command once', async () => {
    class Simple implements Command {
      async handle(event: any): Promise<any> {
        event.simple = true;

        return event;
      }
    }

    const runner = new CommandRunner();
    const result = await runner.run(Simple, {});

    expect(result).toEqual({ simple: true });
  });

  test('runs simple command multiple times and constructs only once', async () => {
    let constructedCount = 0;
    let handleCount = 0;

    class Simple implements Command {
      constructor() {
        constructedCount++;
      }

      async handle(event: any): Promise<any> {
        event.simple = true;

        handleCount++;

        return event;
      }
    }

    const runner = new CommandRunner();
    expect(await runner.run(Simple, {})).toEqual({ simple: true });
    expect(await runner.run(Simple, {})).toEqual({ simple: true });
    expect(constructedCount).toBe(1);
    expect(handleCount).toBe(2);
  });

  test('runs command and single subscriber', async () => {
    const state: any = {
      commandCalled: false,
      commandSubscriberConstructed: 0,
      commandSubscriberCalled: 0,
      commandSubscriberCalledArgs: [],
    };

    class Command implements Command {
      async handle(event: any): Promise<boolean> {
        event.called = true;
        state.commandCalled = true;

        return event;
      }
    }

    // @ts-ignore
    class CommandSubscriber {
      constructor() {
        state.commandSubscriberConstructed++;
      }

      @On(Command)
      async onCommand(_result: boolean, _runner: CommandRunner): Promise<void> {
        state.commandSubscriberCalledArgs = [...arguments];
        state.commandSubscriberCalled++;
      }
    }

    const runner = new CommandRunner();
    const result = await runner.run(Command, {});
    expect(result).toEqual({ called: true });
    expect(state).toEqual({
      commandCalled: true,
      commandSubscriberConstructed: 1,
      commandSubscriberCalled: 1,
      commandSubscriberCalledArgs: [{ called: true }, runner],
    })
  });

  test('runs command with two subscribers', async () => {
    const calls: string[] = [];

    class Command implements Command {
      async handle(event: any): Promise<boolean> {
        event.called = true;

        return event;
      }
    }

    // @ts-ignore
    class CommandSubscriber1 {
      @On(Command)
      async onCommand(): Promise<void> {
        calls.push('CommandSubscriber1')
      }
    }

    // @ts-ignore
    class CommandSubscriber2 {
      @On(Command)
      async onCommand(_result: boolean, _runner: CommandRunner): Promise<void> {
        calls.push('CommandSubscriber2')
      }
    }

    const runner = new CommandRunner();
    const result = await runner.run(Command, {});
    expect(result).toStrictEqual({ called: true });
    expect(calls).toStrictEqual(['CommandSubscriber1', 'CommandSubscriber2']);
  });

  test('runs command with two subscribers with priority', async () => {
    const calls: string[] = [];

    class Command implements Command {
      async handle(event: any): Promise<boolean> {
        event.called = true;

        return event;
      }
    }

    // @ts-ignore
    class CommandSubscriber1 {
      @On(Command, { priority: 2 })
      async onCommand(): Promise<void> {
        calls.push('CommandSubscriber1')
      }
    }

    // @ts-ignore
    class CommandSubscriber2 {
      @On(Command, { priority: 1 })
      async onCommand(_result: boolean, _runner: CommandRunner): Promise<void> {
        calls.push('CommandSubscriber2')
      }
    }

    const runner = new CommandRunner();
    const result = await runner.run(Command, {});
    expect(result).toStrictEqual({ called: true });
    expect(calls).toStrictEqual(['CommandSubscriber2', 'CommandSubscriber1']);
  });

  test('runs commands with subscriber that runs other commands', async () => {
    const calls: { name: string, args: any[] }[] = [];

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
    class OnCreateUser {
      @On(CreateUser)
      async onCreateUser(user: User, runner: CommandRunner): Promise<void> {
        calls.push({ name: 'OnCreateUser', args: [...arguments] });

        await runner.run(UserSubscribe, user.email);
      }
    }

    // @ts-ignore
    class OnUserSubscribe {
      @On(UserSubscribe)
      async onUserSubscribe(email: string, runner: CommandRunner): Promise<void> {
        calls.push({ name: 'OnUserSubscribe', args: [...arguments] });

        await runner.run(SendEmail, email);
      }
    }

    const runner = new CommandRunner();
    const user = await runner.run(CreateUser, { email: 'john@doe.com' });
    expect(user).toBeInstanceOf(User);
    expect(user).toStrictEqual(Object.assign(new User(), { email: 'john@doe.com' }));

    expect(calls).toStrictEqual([
      {
        name: 'CreateUser',
        args: [{ email: 'john@doe.com' }]
      },
      {
        name: 'OnCreateUser',
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
});