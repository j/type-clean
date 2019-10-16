import { Class } from 'type-fest';
import { CommandRunner } from './CommandRunner';

export interface Command<T1 = any, T2 = any> {
  handle: (event?: T1) => Promise<T2>;
}

export abstract class AbstractCommand<T1 = any, T2 = any>
  implements Command<T1, T2> {
  abstract async handle(event?: T1): Promise<T2>;

  private runner: CommandRunner;

  async run<T extends Command>(
    Command: Class<T>,
    event?: Parameters<T['handle']>['0']
  ): Promise<ReturnType<T['handle']>> {
    return this.runner.run(Command, event);
  }

  public setRunner(runner: CommandRunner) {
    this.runner = runner;
  }
}
