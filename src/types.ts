export type AnyFunc = (...args: any[]) => any
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export interface Job {
  type: 'job' | 'create' | 'destroy'
  id: string,
  fn: string;
  args: any[];
}

export interface Result<T> {
  id: string;
  data: T;
}
