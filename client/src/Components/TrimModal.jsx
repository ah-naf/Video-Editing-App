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
import axios from "axios";
import toast from "react-hot-toast";
import { BiTrash } from "react-icons/bi";
import { BsDownload } from "react-icons/bs";
import { IoReload } from "react-icons/io5";

function TrimModal({ videoId, handleClose }) {
  const { video, fetchVideos, deleteTrim } = useVideo(videoId);
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [value, setValue] = useState([0, 0, 0]);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
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

    // Implement the trimming logic here, such as making an API call to the server with startTime and endTime.
    try {
      setLoading(true);

      const { data } = await axios.put(
        "http://localhost:8060/api/video/trim",
        {
          videoId,
          startTime,
          endTime,
        },
        { withCredentials: "include" }
      );

      if (data.status === "success") {
        toast.success(data.message);
        fetchVideos();
      } else {
        toast.error("Something wrong happend. Try again later.");
      }
    } catch (error) {
      toast.error("Something wrong happend. Try again later.");
    }
    setLoading(false);
  };

  const renderTrims = () => {
    const formatArray = Object.keys(video.trims);

    // Sort by timestamp, most recent first
    formatArray.sort((a, b) => {
      const timestampA = a.split("_")[1];
      const timestampB = b.split("_")[1];
      return timestampB.localeCompare(timestampA);
    });

    // Separate processing and processed videos
    const processingVideos = formatArray.filter(
      (filename) => video.trims[filename].processing
    );

    const processedVideos = formatArray.filter(
      (filename) => !video.trims[filename].processing
    );

    const sortedFormats = [...processingVideos, ...processedVideos];

    return sortedFormats.map((filename, index) => {
      const isProcessing = video.trims[filename].processing;

      // Extract start, end times, and timestamp from the filename
      const [timeRange, timestamp] = filename.split("_");
      const [startTime, endTime] = timeRange.split("-").map((time) => {
        return time.replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2:$3");
      });

      const parseTimestamp = (timestamp) => {
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6) - 1; // Month is zero-based
        const day = timestamp.substring(6, 8);
        const hours = timestamp.substring(9, 11);
        const minutes = timestamp.substring(11, 13);
        const seconds = timestamp.substring(13, 15);
        const milliseconds = timestamp.substring(15, 18);

        return new Date(
          Date.UTC(year, month, day, hours, minutes, seconds, milliseconds)
        );
      };

      // Example usage:
      const date = parseTimestamp(timestamp);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      return (
        <div
          key={filename}
          className="flex items-center justify-between bg-gray-200 p-3 shadow rounded mt-4"
        >
          <div>
            <p className="font-medium text-gray-800 uppercase">
              {startTime} - {endTime}
            </p>
            <span className="text-xs">
              {formattedDate} {formattedTime}
            </span>
          </div>
          {isProcessing ? (
            <span className="text-blue-500 font-medium tracking-wider">
              Processing...
            </span>
          ) : (
            <div className="space-x-2">
              <Button
                href={`http://localhost:8060/get-video-asset?videoId=${videoId}&type=trim&filename=${filename}`}
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
                onClick={() => deleteTrim(filename)}
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
        <div className="mt-6">
          <h2 className="text-lg flex items-center gap-2 text-gray-700 font-medium">
            Your Trimmed Video:{" "}
            <span>
              {" "}
              <IoReload
                className="cursor-pointer"
                onClick={() => fetchVideos()}
              />{" "}
            </span>{" "}
          </h2>
          {video.trims && Object.keys(video.trims).length ? (
            renderTrims()
          ) : (
            <p className="text-gray-600">
              You haven&apos;t trimmed this video yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrimModal;
