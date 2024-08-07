const DB = require("../src/DB");
const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");

class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJobs = new Set();
    this.workerPool = [];
    this.maxWorkers = Math.min(4, os.cpus().length); // Set based on number of CPU cores
    this.workerAvailability = new Map();

    this.initWorkerPool();
    this.populateJobs();
    this.logWorkerStatusInterval();
  }

  initWorkerPool() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    const worker = new Worker(path.resolve(__dirname, "./worker.js"));

    worker.on("message", (result) => {
      console.log(`Job ${result.jobId} completed by Worker ${worker.threadId}`);
      this.currentJobs.delete(result.jobId);
      this.workerAvailability.set(worker, true);
      this.assignJobToWorker(worker);
    });

    worker.on("error", (error) => {
      console.error(`Error in worker: ${error.message}`);
      this.workerPool = this.workerPool.filter((w) => w !== worker);
      this.createWorker();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      this.workerPool = this.workerPool.filter((w) => w !== worker);
      this.createWorker();
    });

    this.workerPool.push(worker);
    this.workerAvailability.set(worker, true);
  }

  populateJobs() {
    DB.update();
    DB.videos.forEach((video) => {
      Object.keys(video.resizes).forEach((key) => {
        if (video.resizes[key].processing) {
          const [width, height] = key.split("x");
          this.enqueue({
            type: "resize",
            videoId: video.videoId,
            width,
            height,
          });
        }
      });

      Object.keys(video.formats).forEach((key) => {
        if (video.formats[key].processing) {
          this.enqueue({
            type: "format",
            videoId: video.videoId,
            format: key,
          });
        }
      });

      Object.keys(video.trims).forEach((key) => {
        if (video.trims[key].processing) {
          const fileNameParts = key.split("_");
          const times = fileNameParts[0].split("-");
          const startTime = times[0].replace(
            /(\d{2})(\d{2})(\d{2})/,
            "$1:$2:$3"
          );
          const endTime = times[1].replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2:$3");

          this.enqueue({
            type: "trim",
            videoId: video.videoId,
            startTime,
            endTime,
            timestamp: fileNameParts[1],
          });
        }
      });

      Object.keys(video.crops).forEach((key) => {
        if (video.crops[key].processing) {
          const { width, height, x, y } = video.crops[key];

          this.enqueue({
            type: "crop",
            videoId: video.videoId,
            width: Number(width),
            height: Number(height),
            x: Number(x),
            y: Number(y),
            uniqueFileName: key,
          });
        }
      });
    });
  }

  enqueue(job) {
    this.jobs.push(job);
    this.assignJobs();
  }

  dequeue() {
    return this.jobs.shift();
  }

  assignJobs() {
    this.workerPool.forEach((worker) => {
      if (this.workerAvailability.get(worker)) {
        this.assignJobToWorker(worker);
      }
    });
  }

  assignJobToWorker(worker) {
    const job = this.dequeue();
    if (job) {
      this.workerAvailability.set(worker, false);
      worker.postMessage(job);
      this.currentJobs.add(job.videoId);
      console.log(
        `Assigned job ${job.videoId} (${job.type}) to Worker ${
          worker.threadId
        } at ${new Date().toISOString()}`
      );
    } else {
      this.workerAvailability.set(worker, true);
    }
  }

  logWorkerStatusInterval() {
    setInterval(() => {
      this.logWorkerStatus();
    }, 5000);
  }

  logWorkerStatus() {
    console.log("Worker status:");
    this.workerPool.forEach((worker, index) => {
      console.log(
        `Worker ${index + 1} (Thread ID: ${worker.threadId}): ${
          this.workerAvailability.get(worker) ? "Available" : "Busy"
        } at ${new Date().toISOString()}`
      );
    });
  }
}

module.exports = JobQueue;
