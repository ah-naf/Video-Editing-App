import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Button,
  CircularProgress,
} from "@mui/material";
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
import { Rnd } from "react-rnd";
import { IoReload } from "react-icons/io5";
import { BsDownload } from "react-icons/bs";
import { BiTrash } from "react-icons/bi";

export const CustomSlider = styled(Slider)(({ theme }) => ({
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
  const { video, cropVideo, isCropping, fetchVideos, deleteCrop } =
    useVideo(videoId);
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [cropValue, setCropValue] = useState({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });

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
    setSeeking(true);
  };

  const handleSliderChangeCommitted = (event, newValue) => {
    setSeeking(false);
    if (ref.current) {
      ref.current.seekTo(newValue, "seconds");
    }
  };

  const scaleCropValue = () => {
    const playerWidth = containerRef.current.offsetWidth; // Width of the ReactPlayer container
    const playerHeight = containerRef.current.offsetHeight; // Height of the ReactPlayer container
    const widthScale = video.dimensions.width / playerWidth;
    const heightScale = video.dimensions.height / playerHeight;

    return {
      x: cropValue.x * widthScale,
      y: cropValue.y * heightScale,
      width: cropValue.width * widthScale,
      height: cropValue.height * heightScale,
    };
  };

  const handleCrop = async () => {
    const scaledValues = scaleCropValue();
    try {
      await cropVideo(scaledValues);
    } catch (error) {
      console.error("Crop failed", error);
    }
  };

  useEffect(() => {
    setPlaying(true);
  }, [videoId]);

  const renderCrops = () => {
    const formatArray = Object.keys(video.crops);

    // Separate processing and processed videos
    const processingVideos = formatArray.filter(
      (filename) => video.crops[filename].processing
    );

    const processedVideos = formatArray.filter(
      (filename) => !video.crops[filename].processing
    );

    const sortedFormats = [...processingVideos, ...processedVideos];

    return sortedFormats.map((crop, index) => {
      const isProcessing = video.crops[crop].processing;

      return (
        <div
          key={crop}
          className="flex items-center justify-between bg-gray-200 p-3 shadow rounded mt-4"
        >
          <div>
            <p className="font-medium text-gray-800 uppercase">{crop}</p>
          </div>
          {isProcessing ? (
            <span className="text-blue-500 font-medium tracking-wider">
              Processing...
            </span>
          ) : (
            <div className="space-x-2">
              <Button
                href={`http://localhost:8060/get-video-asset?videoId=${videoId}&type=trim&filename=${crop}`}
                variant="contained"
                color="success"
                size="small"
              >
                Download <BsDownload size={15} className="ml-1" />
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => deleteCrop(crop)}
              >
                Delete <BiTrash size={15} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      );
    });
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
      <DialogContent className="mt-4">
        <div className="relative">
          <p className="mb-2 text-gray-700 font-medium">
            Drag and resize the box to crop the video.
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
                }
              }}
              onDuration={(e) => {
                setTotalTime(e);
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

            {videoLoaded && (
              <Rnd
                default={cropValue}
                onDragStop={(e, d) =>
                  setCropValue({ ...cropValue, x: d.x, y: d.y })
                }
                onResizeStop={(e, direction, ref, delta, position) => {
                  setCropValue({
                    ...cropValue,
                    x: position.x,
                    y: position.y,
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                  });
                }}
                bounds="parent"
                style={{
                  border: "2px solid rgba(255, 255, 255, 0.8)",
                  background: "rgba(0, 0, 0, 0.3)",
                }}
              />
            )}
          </div>

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
              onChangeCommitted={handleSliderChangeCommitted}
              max={totalTime}
              aria-labelledby="continuous-slider"
            />
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <IconButton
            onClick={() => {
              const newTime = currentTime - 5 >= 0 ? currentTime - 5 : 0;
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
                currentTime + 5 <= totalTime ? currentTime + 5 : totalTime;
              setCurrentTime(newTime);
              ref.current.seekTo(newTime, "seconds");
            }}
          >
            <FaForward size={25} className="m-1" />
          </IconButton>
        </div>
        <div className="flex justify-end mt-4 gap-4">
          <Button
            className={isCropping ? "pointer-events-none" : ""}
            variant="contained"
            color="primary"
            onClick={handleCrop}
          >
            {!isCropping ? (
              "Crop"
            ) : (
              <CircularProgress size={20} className="!text-white" />
            )}
          </Button>
        </div>
        <div className="mt-6">
          <h2 className="text-lg flex items-center gap-2 text-gray-700 font-medium">
            Your Cropped Video:{" "}
            <span>
              {" "}
              <IoReload
                className="cursor-pointer"
                onClick={() => fetchVideos()}
              />{" "}
            </span>{" "}
          </h2>
          {video.crops && Object.keys(video.crops).length ? (
            renderCrops()
          ) : (
            <p className="text-gray-600">
              You haven&apos;t cropped this video yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CropModal;
