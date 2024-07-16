import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { CgClose } from "react-icons/cg";
import useVideo from "../Hooks/useVideo";
import ReactPlayer from "react-player";
import {
  FaBackward,
  FaForward,
  FaPause,
  FaPlay,
  FaSpinner,
} from "react-icons/fa";
import { styled } from "@mui/material/styles";

const CustomSlider = styled(Slider)(({ theme }) => ({
  color: "#3a8589",
  height: 3,
  padding: "13px 0",
  "& .MuiSlider-thumb": {
    height: 18,
    width: 18,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
    },
    "& .airbnb-bar": {
      height: 9,
      width: 1,
      backgroundColor: "currentColor",
      marginLeft: 1,
      marginRight: 1,
    },
  },
  "& .MuiSlider-track": {
    height: 5,
  },
  "& .MuiSlider-rail": {
    color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
    opacity: theme.palette.mode === "dark" ? undefined : 1,
    height: 5,
  },
}));

function CropModal({ videoId, handleClose }) {
  const { video } = useVideo(videoId);
  const ref = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
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

  const handleChange = (event, newValue, activeThumb) => {
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
    setPlaying(true);
  }, [videoId]);

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
      <DialogContent className="mt-4">
        <div className="relative">
          <ReactPlayer
            key={videoId} // Adding key prop here
            url={`http://localhost:8060/get-video-asset?type=original&videoId=${videoId}`}
            ref={ref}
            onReady={() => setIsBuffering(false)}
            onStart={() => setIsBuffering(false)}
            playing={playing}
            onProgress={(e) => {
              setCurrentTime(e.playedSeconds);
              setValue((prev) => [prev[0], parseInt(e.playedSeconds), prev[2]]);
            }}
            onDuration={(e) => {
              setTotalTime(e);
              setValue([0, 0, parseInt(e)]);
            }}
            onBuffer={() => setIsBuffering(true)}
            onBufferEnd={() => setIsBuffering(false)}
            className="!w-full !h-[400px]"
          />

          {isBuffering && (
            <div className="absolute h-[400px] top-0 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <FaSpinner className="text-white text-4xl animate-spin" />
            </div>
          )}

          <div className="relative full mt-4">
            <CustomSlider
              value={value}
              onChange={handleChange}
              max={totalTime}
            />
            {/* Track between value[0] and value[2] */}
            <div
              className="absolute top-1/2 transform -translate-y-full bg-orange-500 h-[5px] z-0 rounded"
              style={{
                left: `${(value[0] / totalTime) * 100 + 1.4}%`,
                width: `${((value[1] - value[0]) / totalTime) * 100 - 2.9}%`,
              }}
            />
            <div
              className="absolute -bottom-[13px] transform translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded"
              style={{
                left: `${(value[0] / totalTime) * 100 - 2.3}%`,
              }}
            >
              {formatTime(value[0])}
            </div>
            <div
              className="absolute -bottom-[13px] transform translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded"
              style={{
                left: `${(value[2] / totalTime) * 100 - 3.3}%`,
              }}
            >
              {formatTime(value[2])}
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <IconButton
            onClick={() => {
              ref.current.seekTo(
                value[1] - 5 >= value[0] ? value[1] - 5 : value[0],
                "seconds"
              );
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
              ref.current.seekTo(
                value[1] + 5 <= value[2] ? value[1] + 5 : value[2],
                "seconds"
              );
            }}
          >
            <FaForward size={25} className="m-1" />
          </IconButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CropModal;
