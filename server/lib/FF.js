const { spawn } = require("child_process");

const FF = {};

FF.makeThumbnail = (fullPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    console.log(fullPath, thumbnailPath);
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      fullPath,
      "-ss",
      "5", // thumbnail from 5 second
      "-vframes",
      "1", // get 1 frames
      thumbnailPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code == 0) resolve();
      else reject(`FFmpeg exited with code ` + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.getDimensions = (fullPath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      fullPath,
    ]);

    let dimensions = "";

    ffprobe.stdout.on("data", (data) => {
      dimensions += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        dimensions = dimensions.replace(/\s/g, "").split(",");
        resolve({
          width: Number(dimensions[0]),
          height: Number(dimensions[1]),
        });
      } else {
        console.log({ code });
        reject(`FFprobe exited with code `, code);
      }
    });

    ffprobe.on("error", (err) => {
      reject(err);
    });
  });
};

FF.extractAudio = (originalVideoPath, targetAudioPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      originalVideoPath,
      "-vn",
      "-c:a",
      "copy",
      targetAudioPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.resize = (originalVideoPath, targetVideoPath, width, height) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      originalVideoPath,
      "-vf",
      `scale=${width}:${height}`,
      "-c:a",
      "copy",
      "-y",
      targetVideoPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.crop = (originalVideoPath, targetVideoPath, option) => {
  const { width, height, x, y } = option;

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      originalVideoPath,
      "-filter:v",
      `crop=${parseInt(width)}:${parseInt(height)}:${x}:${y}`,
      targetVideoPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.changeFormat = (originalVideoPath, targetVideoPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", ["-i", originalVideoPath, targetVideoPath]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.trimVideo = (originalVideoPath, targetVideoPath, fromTime, toTime) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      fromTime,
      "-i",
      originalVideoPath,
      "-t",
      toTime,
      "-c",
      "copy",
      targetVideoPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = FF;
