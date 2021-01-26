<h1 align="center" style="border-bottom: none;">type-clean</h1>
<p align="center">A simple (& lightly opinionated) clean architecture framework.</p>

<p align="center">
    <a href="https://www.npmjs.com/~jrdn" target="_blank"><img src="https://img.shields.io/npm/v/type-clean.svg" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/~jrdn" target="_blank"><img src="https://img.shields.io/npm/l/type-clean.svg" alt="Package License" /></a>
    <a href="https://www.npmjs.com/~jrdn" target="_blank"><img src="https://img.shields.io/npm/dm/type-clean.svg" alt="NPM Downloads" /></a>
</p>

## Description

`type-clean` provides a simple and clean way of running commands / "use-cases" and acting (subscribers) upon them.

## Installation

```
yarn add type-clean
```

or

```
npm install type-clean
```


## Usage

```typescript
import { CommandRunner, Command, On } from 'type-clean';


// ./models/User.ts
class User {
  email: string;
}

// ./commands/CreateUser.ts
class CreateUser implements Command {
  async handle(fields: Partial<User>): Promise<User> {
    return Object.assign(new User(), { ...fields });
  }
}

// ./commands/UserSubscribe.ts
class UserSubscribe implements Command {
  async handle(email: string): Promise<string> {
    // subscribe user to 3rd party email system
  }
}

// ./commands/SendEmail.ts
class SendEmail implements Command {
  async handle(email: string): Promise<string> {
    // send some email
  }
}

// ./workflows/CreateUserWorkflow.ts
class CreateUserWorkflow {
  @On(CreateUser)
  async onCreateUser(user: User, runner: CommandRunner): Promise<void> {
    await runner.run(UserSubscribe, user.email);
    await runner.run(SendEmail, user.email);
  }
}

// ./app.ts
import { route } from 'some-framework';

const runner = new CommandRunner();

route.post('/user', async (body: Partial<User>): Promise<User> => {
  return await runner.run(CreateUser, body);
});
```

In this example, we are awaiting 3rd party user subscribes and sending email.  In a real-world app, you'd want to use true `CQRS`, but sometimes that's too much.  It might be best to simply use this module and emit events to `SQS` / `SNS` and handle the subscription asynchronously.

## Using alternative DI. (i.e. inversify)

```typescript
import { Container, injectable, inject } from 'inversify';
import { CommandRunner } from 'type-clean';
import { UserRepository } from './UserRepository';

@injectable()
class CreateUser implements Command {
  constructor(@inject(UserRepository) private repo: UserRepository) {}

  async handle(fields: Partial<User>): Promise<User> {
    return this.repo.create(fields);
  }
}

const container = new Container();
container.bind(UserRepository).toSelf().inSingletonScope();
container.bind(CreateUser).toSelf().inSingletonScope();

const runner = new CommandRunner({ container });

// ...
```

## Events

There are a few ways of executing other logic before or after events are ran.

1. `@Use()`: acts as a middleware.
2. `@BeforeCommand(Command)`: Gets called after `@Use` & before the command is handled.
3. `@AfterCommand(Command)`: Gets called after the command is handled with the handler result.

```typescript
import { Use, BeforeCommand, AfterCommand, Middleware } from 'type-clean';
import { validate } from 'class-validator';

class ValidateCommand implements Middleware {
  async use(input: CreateUserInput): Promise<User> {
    await validate(input);
  }
}

class CreateUserCommand implements Command {
  @Use(ValidateCommand)
  async handle(input: CreateUserInput): Promise<User> {
    // ...
  }
}

class CreateUserSubscriber {
  @BeforeCommand(CreateUserCommand)
  async beforeCreateUser(input: CreateUserInput) {
    console.log(`Creating user ${input.name}`);
  }

  @AfterCommand(CreateUserCommand)
  async afterCreateUser(_input: CreateUserInput, user: User) {
    console.log(`Created user ${user.id}`);
  }
}
```

## Examples

You can run examples by installing `ts-node` globally and running `ts-node examples/type-graphql`.

## Usage in Nest.js

Check out [nestjs-type-clean](https://github.com/j/nestjs-type-clean).

## Test

```bash
$ yarn test
```

## Stay in touch

- Author - [Jordan Stout](https://github.com/j)

## License

`type-clean` is [MIT licensed](LICENSE).