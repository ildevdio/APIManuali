export function createSerialQueue() {
  let queue = Promise.resolve();

  return {
    enqueue(task) {
      const run = queue.then(task, task);
      queue = run.then(() => undefined, () => undefined);
      return run;
    }
  };
}
