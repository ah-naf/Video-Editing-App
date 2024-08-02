const path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const { pipeline } = require("node:stream/promises");
const util = require("../../lib/util");
const DB = require("../DB");
const FF = require("../../lib/FF");
const cluster = require("node:cluster");

let jobs;

if (cluster.isPrimary) {
  const JobQueue = require("../../lib/JobQueue");
  jobs = new JobQueue();
} else {
  jobs = null;
}

const sendJobToMaster = (job) => {
  if (!cluster.isPrimary) {
    process.send({ type: "enqueue-job", job });
  } else {
    jobs.enqueue(job);
  }
};

const getVideos = (req, res) => {
  DB.update();
  const videos = DB.videos.filter((video) => video.userId === req.userId);
  res.status(200).json(videos);
};

const deleteVideo = (req, res) => {
  const videoId = req.query.videoId;
  DB.update();
  let path = `./storage/${videoId}`;
  util.deleteFolder(path);
  DB.videos = DB.videos.filter((video) => video.videoId !== videoId);
  DB.save();
  res
    .status(200)
    .json({ status: "success", message: "Video Deleted Successfully!" });
};

const uploadVideo = async (req, res) => {
  const specifiedFileName = req.headers.filename;
  const extension = path.extname(specifiedFileName).substring(1).toLowerCase();
  const name = path.parse(specifiedFileName).name;
  const videoId = crypto.randomBytes(4).toString("hex");

  const FORMATS_SUPPORTED = ["mov", "mp4", "mkv", "avi", "3gp"];

  if (FORMATS_SUPPORTED.indexOf(extension) == -1) {
    return res
      .status(400)
      .json({ message: "Only these formats are allowed: mov, mp4, mkv" });
  }

  try {
    await fs.mkdir(`./storage/${videoId}`);
    const fullPath = `./storage/${videoId}/original.${extension}`;

    const file = await fs.open(fullPath, "w");
    const fileStream = file.createWriteStream();
    const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;

    await pipeline(req.file, fileStream);

    await FF.makeThumbnail(fullPath, thumbnailPath);

    const dimensions = await FF.getDimensions(fullPath);

    DB.update();
    DB.videos.unshift({
      id: DB.videos.length,
      videoId,
      name,
      extension,
      dimensions,
      userId: req.userId,
      extractedAudio: false,
      resizes: {},
      formats: {},
      trims: {},
      crops: {},
    });
    DB.save();

    res.status(201).json({
      status: "success",
      message: "The file was uploaded successfully!",
    });
  } catch (e) {
    console.log(e);
    // Delete the whole folder
    util.deleteFolder(`./storage/${videoId}`);
    if (e.code !== "ECONNRESET")
      return res.status(500).json({ message: e.message });
  }
};

const extractAudio = async (req, res) => {
  const videoId = req.query.videoId;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.extractAudio) {
    return res
      .status(400)
      .json({ message: "The audio has already been extracted for this video" });
  }
  const originalVideoPath = `./storage/${videoId}/original.${video.extension}`;
  const targetAudioPath = `./storage/${videoId}/audio.aac`;

  try {
    await FF.extractAudio(originalVideoPath, targetAudioPath);

    video.extractedAudio = true;
    DB.save();

    res.status(200).json({
      status: 200,
      message: "The audio was extracted successfully",
    });
  } catch (error) {
    console.log(error);
    util.deleteFile(targetAudioPath);
    return res.status(500).json({ message: error.message });
  }
};

const mimeTypeMapping = {
  mp4: "video/mp4",
  avi: "video/x-msvideo",
  mpeg: "video/mpeg",
  mov: "video/quicktime",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  mkv: "video/x-matroska",
};

const getVideoAsset = async (req, res) => {
  const { videoId, type, format } = req.query;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);
  if (!video) {
    return res.status(400).json({ message: "Video not found!" });
  }

  let file;
  let mimeType, filename;
  try {
    switch (type) {
      case "thumbnail":
        file = await fs.open(`./storage/${videoId}/thumbnail.jpg`, "r");
        mimeType = "image/jpeg";
        break;
      case "audio":
        file = await fs.open(`./storage/${videoId}/audio.aac`, "r");
        mimeType = "audio/aac";
        filename = `${video.name}-audio.aac`;
        break;
      case "resize":
        const dimensions = req.query.dimensions;
        file = await fs.open(
          `./storage/${videoId}/${dimensions}.${video.extension}`,
          "r"
        );
        mimeType =
          mimeTypeMapping[video.extension] || "application/octet-stream";
        filename = `${video.name}-${dimensions}.${video.extension}`;
        break;
      case "original":
        file = await fs.open(
          `./storage/${videoId}/original.${video.extension}`,
          "r"
        );
        mimeType = "video/mp4";
        filename = `${video.name}.${video.extension}`;
        break;
      case "change-format":
        file = await fs.open(`./storage/${videoId}/original.${format}`, "r");
        mimeType = mimeTypeMapping[format] || "application/octet-stream";
        filename = `${video.name}.${format}`;
        break;
      case "trim":
        filename = req.query.filename;
        file = await fs.open(
          `./storage/${videoId}/${filename}.${video.extension}`,
          "r"
        );
        filename = video.name + " " + filename + "." + video.extension;
        mimeType =
          mimeTypeMapping[video.extension] || "application/octet-stream";
        break;
      case "crop":
        file = await fs.open(
          `./storage/${videoId}/cropped.${video.extension}`,
          "r"
        );
        mimeType =
          mimeTypeMapping[video.extension] || "application/octet-stream";
        filename = `${video.name}-cropped.${video.extension}`;
        break;
      default:
        return res.status(400).json({ message: "Invalid type specified" });
    }

    const stat = await file.stat();
    const fileSize = stat.size;

    if (type !== "thumbnail" && type !== "original") {
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    }

    const range = req.headers.range;
    if (range && type === "original") {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", chunkSize);
      res.setHeader("Content-Type", mimeType);

      res.status(206);
      const fileStream = file.createReadStream({
        start,
        end,
        highWaterMark: 64 * 1024,
      });
      await pipeline(fileStream, res);
    } else {
      const fileStream = file.createReadStream();
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stat.size);

      res.status(200);
      await pipeline(fileStream, res);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  } finally {
    if (file) {
      await file.close();
    }
  }
};

const resizeVideo = async (req, res) => {
  const videoId = req.body.videoId;
  const width = Number(req.body.width);
  const height = Number(req.body.height);

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  video.resizes[`${width}x${height}`] = { processing: true };
  DB.save();

  sendJobToMaster({
    type: "resize",
    videoId,
    width,
    height,
  });

  res.status(200).json({
    status: "success",
    message: "The video is now being processed.",
  });
};

const deleteResize = async (req, res) => {
  const { videoId, dimension } = req.query;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Your are not authorized to perform this action.",
    });
  }
  delete video.resizes[dimension];
  const filePath = `./storage/${videoId}/${dimension}.${video.extension}`;
  util.deleteFile(filePath);
  DB.save();

  res.status(200).json({
    status: "success",
    message: "The resized video is deleted successfully",
  });
};

const deleteFormat = async (req, res) => {
  const { videoId, format } = req.query;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Your are not authorized to perform this action.",
    });
  }
  if (video.extension === format) {
    return res.status(400).json({
      status: "error",
      message: "Video format cannot be of original type.",
    });
  }
  delete video.formats[format];
  const filePath = `./storage/${videoId}/original.${format}`;
  util.deleteFile(filePath);
  DB.save();

  res.status(200).json({
    status: "success",
    message: "The resized video is deleted successfully",
  });
};

const cropVideo = async (req, res) => {
  const videoId = req.body.videoId;
  const width = Number(req.body.width);
  const height = Number(req.body.height);
  const x = Number(req.body.x);
  const y = Number(req.body.y);
  const userId = req.userId;

  DB.update();
  const video = DB.videos.find(
    (video) => video.videoId === videoId && video.userId === userId
  );

  if (!video) {
    return res.status(400).json({ message: "Video not found!" });
  }
  const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
  const uniqueFileName = `cropped_${timestamp}`;

  video.crops[uniqueFileName] = {
    processing: true,
    width,
    height,
    x,
    y,
    timestamp,
  };
  DB.save();

  sendJobToMaster({
    type: "crop",
    videoId,
    uniqueFileName,
    width,
    height,
    x,
    y,
  });

  res.status(200).json({
    status: "success",
    message: "The video is now being cropped.",
  });
};

const deleteCrop = async (req, res) => {
  const { videoId, filename } = req.query;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Your are not authorized to perform this action.",
    });
  }
  delete video.crops[filename];
  const filePath = `./storage/${videoId}/${filename}.${video.extension}`;
  util.deleteFile(filePath);
  DB.save();

  res.status(200).json({
    status: "success",
    message: "The cropped video is deleted successfully",
  });
};

const changeFormat = async (req, res) => {
  const userId = req.userId;
  const { videoId, format } = req.body;

  DB.update();
  const video = DB.videos.find(
    (video) => video.videoId === videoId && video.userId === userId
  );

  if (!video) {
    return res.status(400).json({ message: "Video not found!" });
  }
  if (video.formats[format]) {
    return res.status(400).json({ message: "Format already exists." });
  }
  video.formats[format] = { processing: true };
  DB.save();

  sendJobToMaster({
    type: "format",
    videoId,
    format,
  });

  res.status(200).json({
    status: "success",
    message: "The video is now being formatted.",
  });
};

const trimVideo = async (req, res) => {
  const userId = req.userId;
  const { videoId, startTime, endTime } = req.body;

  if (!startTime || !endTime) {
    return res.status(400).json({
      status: "error",
      message: "Start Time or End Time is not defined.",
    });
  }

  DB.update();
  const video = DB.videos.find(
    (video) => video.videoId === videoId && video.userId === userId
  );

  if (!video) {
    return res.status(400).json({ message: "Video not found!" });
  }

  const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
  const uniqueFileName = `${startTime.replace(/:/g, "")}-${endTime.replace(
    /:/g,
    ""
  )}_${timestamp}`;

  video.trims[uniqueFileName] = { processing: true };
  DB.save();

  sendJobToMaster({
    type: "trim",
    videoId,
    startTime,
    endTime,
    timestamp,
  });

  res.status(200).json({
    status: "success",
    message: "The video is now being trimmed",
  });
};

const deleteTrim = async (req, res) => {
  const { videoId, filename } = req.query;

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.userId !== req.userId) {
    return res.status(403).json({
      status: "error",
      message: "Your are not authorized to perform this action.",
    });
  }

  delete video.trims[filename];
  const filePath = `./storage/${videoId}/${filename}.${video.extension}`;
  util.deleteFile(filePath);
  DB.save();

  res.status(200).json({
    status: "success",
    message: "The trimmed video is deleted successfully",
  });
};

const controllers = {
  getVideos,
  uploadVideo,
  getVideoAsset,
  extractAudio,
  resizeVideo,
  deleteVideo,
  deleteResize,
  cropVideo,
  changeFormat,
  deleteFormat,
  trimVideo,
  deleteTrim,
  deleteCrop,
};

module.exports = controllers;
