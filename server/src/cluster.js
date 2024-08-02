const cluster = require("node:cluster");
const os = require("os");
const JobQueue = require("../lib/JobQueue");

if (cluster.isMaster) {
  const jobQueue = new JobQueue();
  const coreCount = os.cpus().length;

  const assignJobToWorker = () => {
    const job = jobQueue.dequeue();
    if (job) {
      const availableWorker = Object.values(cluster.workers).find(
        (worker) => worker.isIdle
      );
      if (availableWorker) {
        availableWorker.isIdle = false;
        availableWorker.send({ type: "job", job });
      }
    }
  };

  for (let i = 0; i < coreCount; i++) {
    const worker = cluster.fork();
    worker.isIdle = true;
    worker.on("message", (msg) => {
      if (msg.type === "request-job") {
        assignJobToWorker();
      } else if (msg.type === "enqueue-job") {
        jobQueue.enqueue(msg.job);
        assignJobToWorker();
      } else if (msg.type === "job-complete") {
        worker.isIdle = true;
        assignJobToWorker();
      }
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal} | ${code})`);
    const newWorker = cluster.fork();
    newWorker.isIdle = true;
    newWorker.on("message", (msg) => {
      if (msg.type === "request-job") {
        assignJobToWorker();
      } else if (msg.type === "enqueue-job") {
        jobQueue.enqueue(msg.job);
        assignJobToWorker();
      } else if (msg.type === "job-complete") {
        newWorker.isIdle = true;
        assignJobToWorker();
      }
    });
  });

  jobQueue.populateJobs();
} else {
  require("./index");
  process.on("message", async (msg) => {
    if (msg.type === "job") {
      const JobQueue = require("../lib/JobQueue");
      const job = new JobQueue();
      await job.processJob(msg.job);
      process.send({ type: "job-complete" });
    }
  });
  process.send({ type: "request-job" });
}
