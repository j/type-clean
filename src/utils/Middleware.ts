export interface Middleware {
  use: (event: any) => Promise<void>;
}
