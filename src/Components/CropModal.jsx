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

  const handleSliderChange = (event, newValue) => {
    setCurrentTime(newValue);
    if (ref.current) {
      ref.current.seekTo(newValue, "seconds");
    }
  };

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
            key={videoId}
            url={`http://localhost:8060/get-video-asset?type=original&videoId=${videoId}`}
            ref={ref}
            playing={playing}
            onReady={() => setIsBuffering(false)}
            onStart={() => setIsBuffering(false)}
            onProgress={(e) => {
              setCurrentTime(e.playedSeconds);
            }}
            onDuration={(e) => {
              setTotalTime(e);
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

          <div className="relative full mt-8">
            <div
              className="absolute -top-[35px] transform translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded"
              style={{
                left: `${(currentTime / totalTime) * 100 - 2.3}%`,
              }}
            >
              {formatTime(currentTime)}
            </div>
            <CustomSlider
              value={currentTime}
              onChange={handleSliderChange}
              max={totalTime}
              aria-labelledby="continuous-slider"
            />
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <IconButton
            onClick={() => {
              ref.current.seekTo(
                currentTime - 5 >= 0 ? currentTime - 5 : 0,
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
                currentTime + 5 <= totalTime ? currentTime + 5 : totalTime,
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
