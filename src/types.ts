import { ChildProcess } from 'child_process';

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

export interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;
}

export interface Worker {
  id: number;
  worker: ChildProcess;
}

export interface ListenEvent {
  resolver: (data: any) => void;
  timeout: NodeJS.Timeout;
}
