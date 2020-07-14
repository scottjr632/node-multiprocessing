import os from 'os';
import path from 'path';
import { fork, ChildProcess } from 'child_process';

import { v4 as uuidv4 } from 'uuid'
import { Job, AnyFunc, ArgumentTypes, Result } from './types';

const MAX_PROCESSES = os.cpus().length;
const TO_SECONDS = 1000;

interface ListenEvent {
  resolver: (data: any) => void; 
  timeout: NodeJS.Timeout;
}

const listeners = new Map<string, ListenEvent>();

export class Pool {
  static MAX_PROCESSES = MAX_PROCESSES;
  static TIMEOUT = 60; // default 60 seconds

  private id: string;
  private master: ChildProcess;

  constructor(numProcesses?: number) {
    this.id = uuidv4();
    this.master = fork(path.resolve(__dirname, './master-worker.js'));
    this.instantiate();

    this.send({
      id: this.id,
      type: 'create',
      fn: (() => {}).toString(),
      args: [numProcesses || Pool.MAX_PROCESSES],
    })
  }

  private instantiate() {
    this.master.on('message', (result: Result<ReturnType<any>>) => {
      const event = listeners.get(result.id);
      if (event) {
        clearTimeout(event.timeout);
        event.resolver(result.data);
      }
    })
  }

  private send(job: Job) {
    this.master.send(job);
  }

  async addJob<TFunction extends AnyFunc>(fn: TFunction,
      ...args: ArgumentTypes<TFunction>): Promise<ReturnType<TFunction>> {

    const id = uuidv4();
    this.send({ fn: fn.toString(), args, id, type: 'job' })

    return new Promise((resolver, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`timeout reached. timeout ${Pool.TIMEOUT}`))
      }, Pool.TIMEOUT * TO_SECONDS)

      listeners.set(id, {
        timeout,
        resolver,
      })
    })
  }

  kill() {
    this.send({
      id: this.id,
      type: 'destroy',
      fn: (() => {}).toString(),
      args: [],
    });
    this.master.kill('SIGINT');
  }
}
