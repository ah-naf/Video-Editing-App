import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import { CgClose } from "react-icons/cg";
import ReactPlayer from "react-player";
import {
  FaBackward,
  FaForward,
  FaPause,
  FaPlay,
  FaSpinner,
} from "react-icons/fa";
import useVideo from "../Hooks/useVideo";
import { CustomSlider } from "./CropModal";

function TrimModal({ videoId, handleClose }) {
  const { video } = useVideo(videoId);
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [value, setValue] = useState([0, 0, 0]);

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const handleSliderChange = (event, newValue, activeThumb) => {
    if (activeThumb === 0) {
      newValue[0] = Math.min(newValue[0], value[1]);
    } else if (activeThumb === 2) {
      newValue[2] = Math.max(newValue[2], value[1]);
    } else {
      newValue[1] = Math.max(newValue[0], Math.min(newValue[1], newValue[2]));
    }

    setValue(newValue);
    if (ref.current && activeThumb === 1 && newValue[1] !== currentTime) {
      ref.current.seekTo(newValue[1], "seconds");
    }
  };

  useEffect(() => {
    if (value[1] >= value[2]) {
      setPlaying(false);
    }
  }, [value]);

  useEffect(() => {
    if (videoId) {
      setIsBuffering(true);
      setPlaying(true);
      setValue([0, 0, 0]);
      setCurrentTime(0);
    }
  }, [videoId]);

  const handleSubmit = () => {
    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

      return `${h}:${m}:${s}`;
    };

    const startTime = formatTime(value[0]);
    const endTime = formatTime(value[2]);

    console.log("Start Time:", startTime);
    console.log("End Time:", endTime);

    // Implement the trimming logic here, such as making an API call to the server with startTime and endTime.
  };

  return (
    <Dialog
      open={!!videoId}
      keepMounted
      maxWidth="lg"
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle className="border-b-2 flex items-center justify-between">
        <h1>{video.name}</h1>
        <span className="cursor-pointer" onClick={handleClose}>
          <CgClose />
        </span>
      </DialogTitle>
      <DialogContent className="mt-4 overflow-y-auto">
        <div className="relative">
          <p className="mb-3 text-gray-700 font-medium">
            Adjust the track to trim the video.
          </p>
          <div className="relative w-full h-[400px]" ref={containerRef}>
            <ReactPlayer
              key={videoId}
              url={`http://localhost:8060/get-video-asset?type=original&videoId=${videoId}`}
              ref={ref}
              playing={playing}
              onReady={() => {
                setIsBuffering(false);
                setVideoLoaded(true);
              }}
              onStart={() => setIsBuffering(false)}
              onProgress={(e) => {
                if (!seeking) {
                  setCurrentTime(e.playedSeconds);
                  setValue((prev) => [
                    prev[0],
                    parseInt(e.playedSeconds),
                    prev[2],
                  ]);
                }
              }}
              onDuration={(e) => {
                setTotalTime(e);
                setValue([0, 0, parseInt(e)]);
              }}
              onBuffer={() => setIsBuffering(true)}
              onBufferEnd={() => setIsBuffering(false)}
              className="!w-full !h-full"
            />

            {isBuffering && (
              <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-10">
                <FaSpinner className="text-white text-4xl animate-spin" />
              </div>
            )}
          </div>

          <div className="relative full mt-8">
            <div
              className="absolute -top-[35px] transform translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded"
              style={{
                left: `${(value[0] / totalTime) * 100 - 2.3}%`,
              }}
            >
              {formatTime(value[0])}
            </div>
            <div
              className="absolute -top-[35px] transform translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded"
              style={{
                left: `${(value[2] / totalTime) * 100 - 2.3}%`,
              }}
            >
              {formatTime(value[2])}
            </div>
            <CustomSlider
              value={value}
              onChange={handleSliderChange}
              max={totalTime}
              aria-labelledby="continuous-slider"
            />
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <IconButton
            onClick={() => {
              const newTime =
                value[1] - 5 >= value[0] ? value[1] - 5 : value[0];
              setCurrentTime(newTime);
              ref.current.seekTo(newTime, "seconds");
            }}
          >
            <FaBackward size={25} className="m-1" />
          </IconButton>
          <IconButton
            onClick={() => {
              setPlaying(!playing);
            }}
          >
            {playing ? (
              <FaPause size={25} className="m-1" />
            ) : (
              <FaPlay size={25} className="m-1" />
            )}
          </IconButton>
          <IconButton
            onClick={() => {
              const newTime =
                value[1] + 5 <= value[2] ? value[1] + 5 : value[2];
              setCurrentTime(newTime);
              ref.current.seekTo(newTime, "seconds");
            }}
          >
            <FaForward size={25} className="m-1" />
          </IconButton>
        </div>
        <div className="flex justify-end">
          <Button variant="contained" size="small" onClick={handleSubmit}>
            Trim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrimModal;
