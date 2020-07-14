import { QueueNode } from './types';

export class Queue<T> {
  public head: QueueNode<T> | null;
  public end: QueueNode<T> | null;

  constructor(head?: QueueNode<T>) {
    this.head = head || null;
    this.end = head || null;
  }

  add(worker: T) {
    const newNode: QueueNode<T> = { value: worker, next: null };
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