const cluster = require("node:cluster");
const os = require("os");
const JobQueue = require("../lib/JobQueue");

if (cluster.isMaster) {
  const jobQueue = new JobQueue();
  const coreCount = os.cpus().length;

  for (let i = 0; i < coreCount; i++) {
    const worker = cluster.fork();
    worker.on("message", (msg) => {
      if (msg.type === "request-job") {
        const job = jobQueue.dequeue();
        if (job) {
          worker.send({ type: "job", job });
        }
      } else if (msg.type === "enqueue-job") {
        jobQueue.enqueue(msg.job);
        assignJobToWorker();
      } else if (msg.type === "job-complete") {
        assignJobToWorker();
      }
    });
  }

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

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal} | ${code})`);
    const newWorker = cluster.fork();
    newWorker.on("message", (msg) => {
      if (msg.type === "request-job") {
        const job = jobQueue.dequeue();
        if (job) {
          newWorker.send({ type: "job", job });
        }
      } else if (msg.type === "enqueue-job") {
        jobQueue.enqueue(msg.job);
        assignJobToWorker();
      } else if (msg.type === "job-complete") {
        assignJobToWorker();
      }
    });
  });

  jobQueue.populateJobs();
} else {
  require("./index");
}
