import { Pool } from './pool';

function printI(i: any): string {
    console.log(`Result: ${i}`)
    for (let i = 0; i < 99999; i++){}
    return `Job ${i} completed`
}

Pool.MAX_PROCESSES = 2
const pool = new Pool();
const promises: any[] = []

for (let i = 1; i < 25; i++) {
    setTimeout(() => {
        pool.addJob(printI, i).then(res => console.log(res))
    }, i);
}

setTimeout(() => {
    pool.kill();

}, 1000 * 26)

// (async() => {
//     await Promise.all(promises)
// })()