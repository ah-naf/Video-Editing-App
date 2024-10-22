const { spawn } = require("child_process");

const FF = {};

FF.makeThumbnail = (fullPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
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
      else {
        if (code === 234) {
          reject("Video doesn't contain any audio stream.");
        } else reject("FFmpeg exited with this code: " + code);
      }
    });

    // ffmpeg.stderr.on("data", (data) => {
    //   console.log(data.toString());
    // });

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

FF.changeFormat = (originalVideoPath, targetVideoPath, dimensions) => {
  return new Promise((resolve, reject) => {
    let ffmpeg;
    if (targetVideoPath.split(".").pop().toLowerCase() === "gif") {
      ffmpeg = spawn("ffmpeg", [
        "-i",
        originalVideoPath,
        "-vf",
        `scale=750:-1`, // Adjust output size based on options
        "-r",
        "15", // Adjust frame rate as needed
        "-loop",
        "0",
        "-y",
        targetVideoPath,
      ]);
    } else {
      ffmpeg = spawn("ffmpeg", ["-i", originalVideoPath, targetVideoPath]);
    }

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject("FFmpeg exited with this code: " + code);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

FF.trimVideo = (originalVideoPath, targetVideoPath, startTime, endTime) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      startTime,
      "-i",
      originalVideoPath,
      "-t",
      endTime,
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
