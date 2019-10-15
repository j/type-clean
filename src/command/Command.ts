export interface Command<T1 = any, T2 = any> {
  handle: (event?: T1) => Promise<T2>;
}
