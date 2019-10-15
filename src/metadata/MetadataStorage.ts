import { Class } from 'type-fest';
import { Command } from '../command';

declare var global: {
  __type_clean_metadata_storage__?: MetadataStorage;
};

export interface SubscriberMetadata {
  HandlerClass: Class;
  SubscriberClass: Class;
  method: string | symbol;
  priority: number;
}

interface Metadata {
  subscribers: Map<Class<Command>, SubscriberMetadata[]>;
}

export class MetadataStorage {
  public metadata: Metadata = {
    subscribers: new Map()
  };
  
  private constructor() {}

  static getInstance(): MetadataStorage {
    if (!global.__type_clean_metadata_storage__) {
      global.__type_clean_metadata_storage__ = new MetadataStorage();
    }

    return global.__type_clean_metadata_storage__;
  }

  public clear() {
    this.metadata.subscribers.clear();
  }
}

export const storage: MetadataStorage = MetadataStorage.getInstance();
