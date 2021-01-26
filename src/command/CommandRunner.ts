import { Container, DefaultContainer } from '../utils/container';
import { CommandHandler, AbstractCommandHandler } from './CommandHandler';
import {
  storage,
  SubscriberMetadata,
  SubscribersMetadata,
} from '../metadata/MetadataStorage';
import { isPromise } from '../utils/isPromise';

import type { Class } from 'type-fest';

export interface CommandRunnerConfig {
  container?: Container;
}

/**
 * Runs commands
 */
export class CommandRunner {
  protected container: Container;
  protected handlers: Map<Class<CommandHandler>, CommandHandler> = new Map();
  protected subscribers: Map<
    Class<CommandHandler>,
    SubscriberMetadata
  > = new Map();

  constructor(config: CommandRunnerConfig = {}) {
    this.container = config.container || new DefaultContainer();
  }

  /**
   * Executes commands.
   */
  async run<T extends CommandHandler>(
    Handler: Class<T>,
    event: Parameters<T['handle']>['0']
  ): Promise<ReturnType<T['handle']>> {
    const handlerOrPromise = this.container.get(Handler);
    const handler = isPromise(handlerOrPromise)
      ? await handlerOrPromise
      : handlerOrPromise;

    if (handler instanceof AbstractCommandHandler) {
      handler.setRunner(this);
    }

    if (!handler) {
      throw new Error('Invalid handler');
    }

    await this.emit('middleware', Handler, [event]);
    await this.emit('before', Handler, [event]);
    const result = await handler.handle(event);
    await this.emit('after', Handler, [event, result]);

    return result;
  }

  /**
   * Serially executes `@BeforeCommand(Handler)` or `@AfterCommand(Handler)` decorated methods for the given `Handler`.
   */
  protected async emit<T extends CommandHandler>(
    type: keyof SubscribersMetadata,
    HandlerClass: Class<T>,
    args: any[]
  ): Promise<void> {
    if (storage.metadata.subscribers[type].has(HandlerClass)) {
      const subscribers = storage.metadata.subscribers[type].get(
        HandlerClass
      ) as SubscriberMetadata[];

      args.push(this);

      for (const meta of subscribers) {
        const subscriber = this.container.get(meta.SubscriberClass);
        await subscriber[meta.method].apply(subscriber, args);
      }
    }
  }
}
