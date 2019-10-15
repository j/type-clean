<h1 align="center" style="border-bottom: none;">type-clean</h1>
<h3 align="center">A simple (& lightly opinionated) clean architecture framework.</h3>

**type-clean** tries to be nothing special.  It provides a simple and clean way of running and scribing to commands/use-cases.

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