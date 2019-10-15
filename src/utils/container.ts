export interface Container {
  get(someClass: any): any;
}

export class DefaultContainer {
  private instances: Map<any, any> = new Map();

  get<T>(HandlerClass: any): T {
    if (!this.instances.has(HandlerClass)) {
      const handler = new HandlerClass();

      this.instances.set(HandlerClass, handler);

      return handler;
    }

    return this.instances.get(HandlerClass) as T;
  }
}