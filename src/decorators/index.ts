import { Class } from 'type-fest';
import {
  storage,
  SubscriberMetadata,
  SubscribersMetadata
} from '../metadata/MetadataStorage';
import { CommandHandler } from '../command';
import { Middleware } from '../utils/Middleware';

interface OnOptions {
  priority?: number;
}

function sortByPriority(arr: { priority: number }[]): void {
  arr.sort((a, b) => (a.priority < b.priority ? 1 : -1));
}

function addSubscriber(
  kind: keyof SubscribersMetadata,
  HandlerClass: Class<CommandHandler>,
  options: OnOptions = {},
  SubscriberClass: any,
  propertyKey: string | symbol
) {
  let subscribers: SubscriberMetadata[];

  if (storage.metadata.subscribers[kind].has(HandlerClass)) {
    subscribers = storage.metadata.subscribers[kind].get(
      HandlerClass
    ) as SubscriberMetadata[];
  } else {
    subscribers = [];
    storage.metadata.subscribers[kind].set(HandlerClass, subscribers);
  }

  subscribers.push({
    HandlerClass,
    SubscriberClass,
    method: propertyKey as string,
    priority: typeof options.priority === 'number' ? options.priority : 0
  });

  sortByPriority(subscribers);
}

export function Use(
  HandlerClass: Class<Middleware>,
  options: OnOptions = {}
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    _descriptor: TypedPropertyDescriptor<any>
  ): void => {
    if (propertyKey !== 'handle') {
      throw new Error('@Use() can only be used on Commands.');
    }

    addSubscriber(
      'middleware',
      target.constructor,
      options,
      HandlerClass,
      'use'
    );
  };
}

export function BeforeCommand(
  HandlerClass: Class<CommandHandler>,
  options: OnOptions = {}
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    _descriptor: TypedPropertyDescriptor<any>
  ): void => {
    addSubscriber(
      'before',
      HandlerClass,
      options,
      target.constructor,
      propertyKey
    );
  };
}

export function AfterCommand(
  HandlerClass: Class<CommandHandler>,
  options: OnOptions = {}
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    _descriptor: TypedPropertyDescriptor<any>
  ): void => {
    addSubscriber(
      'after',
      HandlerClass,
      options,
      target.constructor,
      propertyKey
    );
  };
}
