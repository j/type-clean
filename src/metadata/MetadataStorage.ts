import { Class } from 'type-fest';
import { CommandHandler } from '../command';

declare var global: {
  __type_clean_metadata_storage__?: MetadataStorage;
};

export interface SubscriberMetadata {
  HandlerClass: Class;
  SubscriberClass: Class;
  method: string | symbol;
  priority: number;
}

export interface SubscribersMetadata {
  middleware: Map<Class<CommandHandler>, SubscriberMetadata[]>;
  before: Map<Class<CommandHandler>, SubscriberMetadata[]>;
  after: Map<Class<CommandHandler>, SubscriberMetadata[]>;
}

interface Metadata {
  subscribers: SubscribersMetadata;
}

export class MetadataStorage {
  public metadata: Metadata = {
    subscribers: {
      middleware: new Map(),
      before: new Map(),
      after: new Map()
    }
  };

  private constructor() {}

  static getInstance(): MetadataStorage {
    if (!global.__type_clean_metadata_storage__) {
      global.__type_clean_metadata_storage__ = new MetadataStorage();
    }

    return global.__type_clean_metadata_storage__;
  }

  public clear() {
    this.metadata.subscribers.middleware.clear();
    this.metadata.subscribers.before.clear();
    this.metadata.subscribers.after.clear();
  }
}

export const storage: MetadataStorage = MetadataStorage.getInstance();
