import { Class } from 'type-fest';
import { Container, DefaultContainer } from '../utils/container';
import { Command } from './Command';
import {
  storage,
  SubscriberMetadata,
  SubscribersMetadata
} from '../metadata/MetadataStorage';

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
  async run<T extends Command>(
    Command: Class<T>,
    event?: any
  ): Promise<ReturnType<T['handle']>> {
    const command = this.container.get(Command);

    if (!command) {
      throw new Error('Invalid handler');
    }

    await this.emit('middleware', Command, event);
    await this.emit('before', Command, event);
    const result = await command.handle(event);
    await this.emit('after', Command, result);

    return result;
  }

  /**
   * Serially executes `@BeforeCommand(Handler)` or `@AfterCommand(Handler)` decorated methods for the given `Handler`.
   */
  protected async emit<T extends Command>(
    type: keyof SubscribersMetadata,
    HandlerClass: Class<T>,
    result: ReturnType<T['handle']>
  ): Promise<void> {
    if (storage.metadata.subscribers[type].has(HandlerClass)) {
      const subscribers = storage.metadata.subscribers[type].get(
        HandlerClass
      ) as SubscriberMetadata[];
      for (const meta of subscribers) {
        await this.container
          .get(meta.SubscriberClass)
          [meta.method](result, this);
      }
    }
  }
}
