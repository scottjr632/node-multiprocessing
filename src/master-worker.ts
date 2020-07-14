import path from 'path';
import { fork, ChildProcess } from 'child_process';

import { Job } from './types';
import { clearInterval } from 'timers';

interface Worker {
  id: number;
  worker: ChildProcess;
}

interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;
}

class Queue<T> {
  public head: QueueNode<T> | null;
  public end: QueueNode<T> | null;

  constructor(head?: QueueNode<T>) {
    this.head = head || null;
    this.end = head || null;
  }

  add(worker: T) {
    const newNode: QueueNode<T> = { value: worker, next: null }
    if (this.end) {
      this.end.next = newNode;
    } else {
      this.head = newNode;
    }
    this.end = newNode;
  }

  pop(): T | null {
    const popped = this.head;
    if (this.head === this.end) {
      this.end = null;
    }
    if (this.head) {
      this.head = this.head.next;
    }
    return popped?.value || null;
  }
}

const availableWorkers: Queue<Worker> = new Queue();
const awaitingJobs: Queue<Job> = new Queue();

const workerCallback = (worker: Worker): (res: any) => void => {
  return (res) => {
    availableWorkers.add(worker);
    if (process.send) {
      process.send(res);
    }
  }
}

process.on('message', (msg: Job) => {
  if (msg.type === 'create' && msg.args.length > 0) {
    for (let i = 0; i < msg.args[0]; i++) {
      const worker = fork(path.resolve(__dirname, './worker.js'))
      const newWorker = {
        id: i + 1,
        worker,
      }
      worker.on('message', workerCallback(newWorker));
      availableWorkers.add(newWorker);
    }
  }

  if (msg.type === 'job') {
    awaitingJobs.add(msg);
  }

  if (msg.type === 'destroy') {
    const destroyTimer = setInterval(() => {
      const job = awaitingJobs.pop();
      if (!job) {
        let worker = availableWorkers.pop();
        while (worker) {
          worker.worker.kill('SIGINT');
          worker = availableWorkers.pop();
        }
        clearInterval(destroyTimer);
      }
    }, 500);
  }
})

// main event loop
setInterval(() => {
  const worker = availableWorkers.pop();
  if (worker) {
    const job = awaitingJobs.pop();
    if (job) {
      worker.worker.send(job);
    } else {
      availableWorkers.add(worker);
    }
  }
}, 1)
