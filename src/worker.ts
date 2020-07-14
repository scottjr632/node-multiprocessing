import { Job } from './types';

function looseJsonParse(obj: string): Function {
  return Function('"use strict";return (' + obj + ')')();
}

process.on('message', async (job: Job) => {
  const fn = looseJsonParse(job.fn);
  const data = fn(...job.args);

  if (process.send) {
    process.send({
      data,
      id: job.id,
    });
  }
});
