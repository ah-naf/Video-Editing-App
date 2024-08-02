import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React, { useState } from "react";
import { CgClose } from "react-icons/cg";
import useVideo from "../Hooks/useVideo";
import { GoArrowBoth } from "react-icons/go";
import toast from "react-hot-toast";
import t from "../assets/util";
import axios from "axios";
import { IoReload } from "react-icons/io5";
import { BsDownload } from "react-icons/bs";
import { BiTrash } from "react-icons/bi";

function ChangeFormatModal({ videoId, handleClose }) {
  const { video, addFormat, fetchVideos, deleteFormat } = useVideo(videoId);
  const [format, setFormat] = useState("");
  const [changeFormatLoading, setChangeFormatLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (format.toLowerCase() === video.extension.toLowerCase()) {
      return toast.error("Changed format can't be same as original format");
    }

    setChangeFormatLoading(true);

    try {
      /** @API call */
      await axios.put(
        "http://localhost:8060/api/video/change-format",
        {
          videoId,
          format,
        },
        { withCredentials: "include" }
      );
      setFormat("");
      toast.success(t.alert.success.video.format);
      addFormat(format);
    } catch (error) {
      console.log(error);
      toast.error(t.alert.error.default);
    }

    setChangeFormatLoading(false);
  };

  const renderFormats = () => {
    const formatArray = Object.keys(video.formats);

    // Separate processing and processed videos
    const processingVideos = formatArray.filter(
      (dimensions) => video.formats[dimensions].processing
    );

    const processedVideos = formatArray.filter(
      (dimensions) => !video.formats[dimensions].processing
    );

    const sortedFormats = [...processingVideos, ...processedVideos];

    return sortedFormats.map((format, index) => {
      const isProcessing = video.formats[format].processing;

      return (
        <div
          key={format}
          className="flex items-center justify-between bg-gray-200 p-3 shadow rounded mt-4"
        >
          <p className="font-medium text-gray-800 uppercase">{format}</p>
          {isProcessing ? (
            <span className="text-blue-500 font-medium tracking-wider">
              Processing...
            </span>
          ) : (
            <div className="space-x-2">
              <Button
                href={`http://localhost:8060/get-video-asset?videoId=${videoId}&type=change-format&format=${format}`}
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
                onClick={() => deleteFormat(format)}
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
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle className="border-b-2 flex items-center justify-between">
        <h1>{video.name}</h1>
        <span className="cursor-pointer" onClick={handleClose}>
          <CgClose />
        </span>
      </DialogTitle>
      <DialogContent className="mt-4 !min-w-[400px">
        <p className="text-gray-700 font-medium mb-4">
          Change the video format:
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex items-center justify-between"
        >
          <div className="flex items-center justify-center gap-4 flex-1">
            <select
              name="source"
              id="source"
              disabled
              className="uppercase  p-2 shadow rounded bg-gray-200 disabled:cursor-not-allowed disabled:shadow font-medium border-none outline-none"
            >
              <option value={video.extension}>{video.extension}</option>
            </select>
            <span>
              <GoArrowBoth size={20} />
            </span>
            <select
              name="dest"
              id="dest"
              required
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="uppercase p-2 shadow rounded bg-gray-200 font-medium border-none outline-none"
            >
              <option value="">Select a format</option>
              <option value="mp4">mp4</option>
              <option value="avi">avi</option>
              <option value="gif">gif</option>
              <option value="mov">mov</option>
              <option value="mkv">mkv</option>
            </select>
          </div>
          <Button
            variant="contained"
            className={changeFormatLoading ? "pointer-events-none" : ""}
            size="small"
            type="submit"
          >
            {changeFormatLoading ? (
              <CircularProgress className="!text-white" size={24} />
            ) : (
              "Change"
            )}
          </Button>
        </form>
        <div className="mt-6">
          <h2 className="text-lg flex items-center gap-2 text-gray-700 font-medium">
            Your Changed Video Formats:{" "}
            <span>
              {" "}
              <IoReload
                className="cursor-pointer"
                onClick={() => fetchVideos()}
              />{" "}
            </span>{" "}
          </h2>
          {video.formats && Object.keys(video.formats).length ? (
            renderFormats()
          ) : (
            <p className="text-gray-600">No changed format found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeFormatModal;
