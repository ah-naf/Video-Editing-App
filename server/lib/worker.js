const { parentPort, threadId } = require("worker_threads");
const FF = require("./FF");
const DB = require("../src/DB");
const util = require("./util");

async function processCrop(job) {
  DB.update();
  const video = DB.videos.find((video) => video.videoId === job.videoId);
  const originalVideoPath = `storage/${video.videoId}/original.${video.extension}`;
  const targetVideoPath = `storage/${video.videoId}/${job.uniqueFileName}.${video.extension}`;
  util.deleteFile(targetVideoPath);

  try {
    await FF.crop(originalVideoPath, targetVideoPath, {
      width: job.width,
      height: job.height,
      x: job.x,
      y: job.y,
    });

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

async function processResize(job) {
  DB.update();
  const video = DB.videos.find((video) => video.videoId === job.videoId);
  const videoName = video.name;
  const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
  const targetVideoPath = `./storage/${video.videoId}/${job.width}x${job.height}.${video.extension}`;

  try {
    await FF.resize(originalVideoPath, targetVideoPath, job.width, job.height);
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

async function processFormat(job) {
  DB.update();
  const video = DB.videos.find((video) => video.videoId === job.videoId);
  const videoName = video.name;
  const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
  const targetVideoPath = `./storage/${video.videoId}/original.${job.format}`;

  try {
    await FF.changeFormat(originalVideoPath, targetVideoPath, video.dimensions);
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

async function processTrim(job) {
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
    await FF.trimVideo(
      originalVideoPath,
      targetVideoPath,
      job.startTime,
      job.endTime
    );
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

const processJob = async (job) => {
  try {
    console.log(
      `Worker ${threadId} processing job ${job.videoId} (${
        job.type
      }) at ${new Date().toISOString()}`
    );
    if (job.type === "resize") {
      await processResize(job);
    } else if (job.type === "format") {
      await processFormat(job);
    } else if (job.type === "trim") {
      await processTrim(job);
    } else if (job.type === "crop") {
      await processCrop(job);
    }
  } catch (error) {
    console.error(`Error processing job: ${error.message}`);
  } finally {
    parentPort.postMessage({ jobId: job.videoId });
    console.log(
      `Worker ${process.threadId} completed job ${job.videoId} (${
        job.type
      }) at ${new Date().toISOString()}`
    );
  }
};

parentPort.on("message", (job) => {
  processJob(job);
});
