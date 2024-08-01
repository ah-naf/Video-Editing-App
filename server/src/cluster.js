const cluster = require("node:cluster");
const os = require("node:os");
const JobQueue = require("../lib/JobQueue");

if (cluster.isPrimary) {
  const jobs = new JobQueue();
  const coreCount = os.availableParallelism();

  for (let i = 0; i < coreCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal} | ${code})`);
    cluster.fork();
  });

  // Listen for messages from worker processes
  cluster.on("message", (worker, message) => {
    if (message.type === "enqueueJob") {
      jobs.enqueue(message.job);
    }
  });
} else {
  require("./index");
}
