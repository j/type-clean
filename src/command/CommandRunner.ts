import { Class } from 'type-fest';
import { Container, DefaultContainer } from '../utils/container';
import { Command } from './Command';
import { storage, SubscriberMetadata } from '../metadata/MetadataStorage';

interface RunnerConfig {
  container?: Container;
}

/**
 * Runs commands
 */
export class CommandRunner {
  protected container: Container;
  protected handlers: Map<Class<Command>, Command> = new Map();
  protected subscribers: Map<Class<Command>, SubscriberMetadata> = new Map();

  constructor(config: RunnerConfig = {}) {
    this.container = config.container || new DefaultContainer();
  }

  /**
   * Executes commands.
   */
  async run<T extends Command>(Command: Class<T>, event: any): Promise<ReturnType<T['handle']>> {
    const handler = this.container.get(Command);

    if (!handler) {
      throw new Error('Handler does not exist');
    }

    return this.emit(Command, await handler.handle(event));
  }

  /**
   * Serially executes `@On(Handler)` decorated methods for the given `Handler`.
   */
  protected async emit<T extends Command>(HandlerClass: Class<T>, result: ReturnType<T['handle']>): Promise<ReturnType<T['handle']>> {
    if (storage.metadata.subscribers.has(HandlerClass)) {
      const subscribers = storage.metadata.subscribers.get(HandlerClass) as SubscriberMetadata[];
      for (const meta of subscribers) {
        await this.container.get(meta.SubscriberClass)[meta.method](result, this);
      }
    }

    return result;
  }
}
