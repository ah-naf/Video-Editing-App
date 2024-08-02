const DB = require("../src/DB");
const FF = require("./FF");
const util = require("./util");
const cluster = require("node:cluster");

class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJob = null;
    this.populateJobs();
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
    if (job) {
      this.jobs.push(job);
      if (cluster.isMaster) {
        this.executeNext();
      }
    }
  }

  dequeue() {
    return this.jobs.shift();
  }

  executeNext() {
    if (this.currentJob) return;
    this.currentJob = this.dequeue();
    if (!this.currentJob) return;
    this.execute(this.currentJob);
  }

  async execute(job) {
    if (cluster.isMaster) {
      this.executeInWorker(job);
    } else {
      await this.processJob(job);
      process.send({ type: "job-complete" });
    }
  }

  executeInWorker(job) {
    const availableWorker = Object.values(cluster.workers).find(
      (worker) => worker.isIdle
    );
    if (availableWorker) {
      availableWorker.isIdle = false;
      availableWorker.send({ type: "job", job });
    }
  }

  async processJob(job) {
    if (job.type === "resize") {
      await this.processResize(job);
    } else if (job.type === "format") {
      await this.processFormat(job);
    } else if (job.type === "trim") {
      await this.processTrim(job);
    } else if (job.type === "crop") {
      await this.processCrop(job);
    }
  }

  async processCrop(job) {
    DB.update();
    const video = DB.videos.find((video) => video.videoId === job.videoId);
    const originalVideoPath = `storage/${video.videoId}/original.${video.extension}`;
    const targetVideoPath = `storage/${video.videoId}/${job.uniqueFileName}.${video.extension}`;
    util.deleteFile(targetVideoPath);

    try {
      console.log("Cropping " + job.uniqueFileName);
      await FF.crop(originalVideoPath, targetVideoPath, {
        width: job.width,
        height: job.height,
        x: job.x,
        y: job.y,
      });

      console.log("Finished cropping " + job.uniqueFileName);
      DB.update();
      const updatedVideo = DB.videos.find(
        (video) => video.videoId === job.videoId
      );
      updatedVideo.crops[job.uniqueFileName].processing = false;
      DB.save();
    } catch (error) {
      console.log(error);
      util.deleteFile(targetVideoPath);
    }
  }

  async processResize(job) {
    DB.update();
    const video = DB.videos.find((video) => video.videoId === job.videoId);
    const videoName = video.name;
    const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
    const targetVideoPath = `./storage/${video.videoId}/${job.width}x${job.height}.${video.extension}`;

    try {
      console.log(`Resizing ${videoName}`);
      await FF.resize(
        originalVideoPath,
        targetVideoPath,
        job.width,
        job.height
      );
      console.log(`Finished resizing ${videoName}`);
      DB.update();
      const updatedVideo = DB.videos.find(
        (video) => video.videoId === job.videoId
      );
      updatedVideo.resizes[`${job.width}x${job.height}`].processing = false;
      DB.save();
    } catch (error) {
      console.log(error);
      util.deleteFile(targetVideoPath);
    }
  }

  async processFormat(job) {
    DB.update();
    const video = DB.videos.find((video) => video.videoId === job.videoId);
    const videoName = video.name;
    const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
    const targetVideoPath = `./storage/${video.videoId}/original.${job.format}`;

    try {
      console.log(`Changing format of ${videoName}`);
      await FF.changeFormat(originalVideoPath, targetVideoPath);
      console.log(`Finished changing format of ${videoName}`);
      DB.update();
      const updatedVideo = DB.videos.find(
        (video) => video.videoId === job.videoId
      );
      updatedVideo.formats[job.format].processing = false;
      DB.save();
    } catch (error) {
      console.log(error);
      util.deleteFile(targetVideoPath);
    }
  }

  async processTrim(job) {
    DB.update();
    const video = DB.videos.find((video) => video.videoId === job.videoId);
    const timestamp = job.timestamp;
    const uniqueFileName = `${job.startTime.replace(
      /:/g,
      ""
    )}-${job.endTime.replace(/:/g, "")}_${timestamp}`;
    const originalVideoPath = `storage/${video.videoId}/original.${video.extension}`;
    const targetVideoPath = `storage/${video.videoId}/${uniqueFileName}.${video.extension}`;

    try {
      console.log(`Trimming video ${uniqueFileName}`);
      await FF.trimVideo(
        originalVideoPath,
        targetVideoPath,
        job.startTime,
        job.endTime
      );
      console.log(`Finished trimming video ${uniqueFileName}`);
      DB.update();
      const updatedVideo = DB.videos.find(
        (video) => video.videoId === job.videoId
      );
      updatedVideo.trims[uniqueFileName].processing = false;
      DB.save();
    } catch (error) {
      console.log(error);
      util.deleteFile(targetVideoPath);
    }
  }
}

module.exports = JobQueue;
