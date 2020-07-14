Easy multiprocessing in nodejs
===
<!-- toc -->
- [Easy multiprocessing in nodejs](#easy-multiprocessing-in-nodejs)
- [About](#about)
- [Install](#install)
- [Usage](#usage)
  - [Singleton usage](#singleton-usage)
  - [Class usage](#class-usage)
  - [Adding jobs](#adding-jobs)
  - [Killing process pool](#killing-process-pool)
<!-- tocstop -->
# About
`node-multiprocess` makes multiprocessing in nodejs simple. Sometimes there are CPU bound tasks that are required in nodejs, `node-multiprocess` allows a node program to run concurrently to keep IO moving on the main thread.

# Install
```bash
$ npm i node-multiprocess
$ # or
$ yarn add node-multiprocess
```
# Usage
```typescript
// node-multiprocess exports a singleton and a class to be used
// the default export is the singleton class
import SingletonPool from 'node-multiprocess';
// or
import { SingletonPool } from 'node-multiprocess';

// a regular class can be imported like this
import { Pool } from 'node-multiprocess'; 
```
## Singleton usage
**There will only ever be one instance of the singleton class**
```typescript
// Before getting first instance of singleton class, you can set the number of processes 
SingletonPool.setMaxProcesses(4); // default is the number of CPUs on machine
// The timeout can also be adjusted in seconds
SingletonPool.setTimeout(120); // default is 60 seconds

const pool = SingletonPool.getInstance();
...
const pool = SingletonPool.getInstance(); // same instance as above
```
## Class usage
**There can be many instances of the `Pool` class, however, it is not recomended to have more than one at a time because this can cause performance issues**
```typescript
// Number of process can be set either before instantiation or during
// before 
Pool.MAX_PROCESSES = 4; // default is the number of CPUs
// during
const pool = new Pool(4); // both create a pool with four processes
// The timeout can also be adjusted before instantiation
Pool.TIMEOUT = 120; // default is 60 seconds
const secondPool = new Pool();
// ^ Pool will have four processes and a timeout of 120 seconds
// create `secondPool` before killing `pool` will cause their to be four additional worker processes alive
```
## Adding jobs
Jobs can be aded by calling the `addJob` method. This method returns a promise of the resulting type from the function that is passed to the method
```typescript
const pool = new Pool(4);

function fibSlow(n: number): number {
    if (n <= 0) {
        return 1;
    }
    return fibSlow(n-1) + fibSlow(n-2);
}

const promises = []
for (let i = 1; i < 6; i++) {
    const resultPromise = pool.addJob(fibSlow, i);
    promise.push(resultPromise)
}

const promisesResults = await Promise.all(promises);
promisesResults.forEach(result => console.log(result));
// 1 2 3 5 8
```
The `addJob` method can accepts any number of arguments and types
```typescript
function addThree(x: number, y: number, z: number): number {
    return x + Y + Z;
}
pool.addJob(addThree, 10, 15, 20);
// Promise<number> => 45

function mergeObj(obj1: Object, obj2: Object): Object {
    return {
        ...obj1,
        ...obj2
    };
}
pool.addJob(mergeObj, {a: 'a'}, {b: 'b'});
// Promise<Object> => {a: 'a', b: 'b'}
```
## Killing process pool
When finished with process pool and all jobs are complete use the `kill` method to destroy all process
```typescript
pool.kill(); // sends SIGINT to all child processes
```