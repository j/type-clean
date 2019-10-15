import { Class } from 'type-fest';
import { storage, SubscriberMetadata } from '../metadata/MetadataStorage';
import { Command } from '../command';

interface OnOptions {
  priority?: number;
}

export function On(HandlerClass: Class<Command>, options: OnOptions = {}): MethodDecorator {
  return (target: any, propertyKey: string | symbol, _descriptor: TypedPropertyDescriptor<any>): void => {
    let subscribers: SubscriberMetadata[];

    if (storage.metadata.subscribers.has(HandlerClass)) {
      subscribers = storage.metadata.subscribers.get(HandlerClass) as SubscriberMetadata[];
    } else {
      subscribers = [];
      storage.metadata.subscribers.set(HandlerClass, subscribers);
    }

    subscribers.push({
      HandlerClass,
      SubscriberClass: target.constructor,
      method: propertyKey as string,
      priority: typeof options.priority === 'number' ? options.priority : subscribers.length + 1
    });

    subscribers.sort((a, b) => (a.priority > b.priority) ? 1 : -1);
  }
}