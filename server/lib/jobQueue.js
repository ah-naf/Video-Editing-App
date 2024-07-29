const DB = require("../src/DB");
const FF = require("./FF");
const util = require("./util");

class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJob = null;

    DB.update();
    DB.videos.forEach((video) => {
      // For resizes
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

      // for changing format
      Object.keys(video.formats).forEach((key) => {
        if (video.formats[key].processing) {
          this.enqueue({
            type: "format",
            videoId: video.videoId,
            format: key,
          });
        }
      });
    });
  }

  enqueue(job) {
    if (job) this.jobs.push(job);
    this.executeNext();
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
    if (job.type === "resize") {
      DB.update();
      const video = DB.videos.find((video) => video.videoId === job.videoId);
      const videoName = video.name;
      const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
      const targetVideoPath = `./storage/${video.videoId}/${job.width}x${job.height}.${video.extension}`;

      try {
        console.log("Resizing " + videoName);
        await FF.resize(
          originalVideoPath,
          targetVideoPath,
          job.width,
          job.height
        );

        console.log("Finished Resizing " + videoName);
        DB.update();
        const video = DB.videos.find((video) => video.videoId === job.videoId);
        video.resizes[`${job.width}x${job.height}`] = { processing: false };
        DB.save();
        console.log("Job remaining: " + this.jobs.length);
      } catch (error) {
        console.log(error);
        util.deleteFile(targetVideoPath);
      }
    } else if (job.type === "format") {
      DB.update();
      const video = DB.videos.find((video) => video.videoId === job.videoId);
      const videoName = video.name;

      const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
      const targetVideoPath = `./storage/${video.videoId}/original.${job.format}`;

      try {
        console.log("changing " + videoName);
        await FF.changeFormat(originalVideoPath, targetVideoPath);

        console.log("Finished changing " + videoName);
        DB.update();
        const video = DB.videos.find((video) => video.videoId === job.videoId);
        video.formats[job.format] = { processing: false };
        DB.save();
        console.log("Job remaining: " + this.jobs.length);
      } catch (error) {
        console.log(error);
        util.deleteFile(targetVideoPath);
      }
    }

    this.currentJob = null;
    this.executeNext();
  }
}

module.exports = JobQueue;
