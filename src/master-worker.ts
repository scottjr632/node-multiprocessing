import path from 'path';
import { clearInterval } from 'timers';
import { fork } from 'child_process';

import { Job, Worker } from './types';
import { Queue } from './queue';

const DESTROY_INTERVAL = 500;

const availableWorkers: Queue<Worker> = new Queue();
const awaitingJobs: Queue<Job> = new Queue();

const workerCallback = (worker: Worker): (res: any) => void => {
  return (res) => {
    availableWorkers.add(worker);
    if (process.send) {
      process.send(res);
    }
  };
};

process.on('message', (msg: Job) => {
  if (msg.type === 'create' && msg.args.length > 0) {
    for (let i = 0; i < msg.args[0]; i++) {
      const worker = fork(path.resolve(__dirname, './worker.js'));
      const newWorker = {
        id: i + 1,
        worker,
      };
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
    }, DESTROY_INTERVAL);
  }
});

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
}, 1);
