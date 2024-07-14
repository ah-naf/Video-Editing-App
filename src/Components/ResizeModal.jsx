import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useVideo from "../Hooks/useVideo";
import { CircularProgress, TextField } from "@mui/material";
import { CgClose } from "react-icons/cg";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import t from "../assets/util";
import { IoReload } from "react-icons/io5";
import { FiDelete } from "react-icons/fi";
import { BiTrash } from "react-icons/bi";
import { FaDownLong } from "react-icons/fa6";
import { BsDownload } from "react-icons/bs";

export default function ResizeModal({ videoId, handleClose }) {
  const [resizeLoading, setResizeLoading] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const { video, addResize, fetchVideos } = useVideo(videoId);

  const onFormSubmit = async (e) => {
    e.preventDefault();

    if (
      !Number(width) ||
      !Number(height) ||
      Number(width) <= 0 ||
      Number(height) <= 0 ||
      Number(width) > video.dimensions.width ||
      Number(height) > video.dimensions.height
    ) {
      toast.error(t.alert.error.video.resize.range);
      return;
    }

    // Check if numbers are even
    if (Number(width) % 2 !== 0 || Number(height) % 2 !== 0) {
      toast.error(t.alert.error.video.resize.even);
      return;
    }

    setResizeLoading(true);

    try {
      /** @API call */
      await axios.put(
        "http://localhost:8060/api/video/resize",
        {
          videoId,
          width,
          height,
        },
        { withCredentials: "include" }
      );

      setWidth("");
      setHeight("");
      toast.success(t.alert.success.video.resized);
      addResize(width, height);
    } catch (e) {
      console.log(e);
      toast.error(t.alert.error.default);
    }

    setResizeLoading(false);
  };

  const renderResizes = () => {
    const dimensionsArray = Object.keys(video.resizes);

    // Separate processing and processed videos
    const processingVideos = dimensionsArray.filter(
      (dimensions) => video.resizes[dimensions].processing
    );

    const processedVideos = dimensionsArray.filter(
      (dimensions) => !video.resizes[dimensions].processing
    );

    // Sort processed videos by resolution (higher resolution first)
    processedVideos.sort((a, b) => {
      const resolutionA = a.split("x").map(Number);
      const resolutionB = b.split("x").map(Number);

      if (resolutionA[0] !== resolutionB[0]) {
        return resolutionB[0] - resolutionA[0];
      } else {
        return resolutionB[1] - resolutionA[1];
      }
    });

    // Combine processing and sorted processed videos
    const sortedDimensions = [...processingVideos, ...processedVideos];
    return sortedDimensions.map((dimensions, ind) => {
      const width = dimensions.split("x")[0];
      const height = dimensions.split("x")[1];

      const isProcessing = video.resizes[dimensions].processing;

      return (
        <div
          key={dimensions}
          className="flex items-center justify-between bg-gray-200 p-3 shadow rounded mt-4"
        >
          <p className="font-medium text-gray-800">
            {width} &times; {height}
          </p>
          {isProcessing ? (
            <span className="text-blue-500 font-medium tracking-wider">
              Processing...
            </span>
          ) : (
            <div className="space-x-2">
              <Button
                href={`http://localhost:8060/get-video-asset?videoId=${videoId}&type=resize&dimensions=${dimensions}`}
                variant="contained"
                color="success"
                size="small"
              >
                Download <BsDownload size={15} className="ml-1" />
              </Button>
              <Button variant="contained" color="error" size="small">
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
      <DialogContent className="mt-4">
        <div>
          <p className="text-gray-700">Specify a new width and height:</p>
          <form
            onSubmit={onFormSubmit}
            className="flex items-center mt-4 gap-4 justify-center"
          >
            <TextField
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-52"
              label="Width"
              size="small"
              required
            />
            <span>&times;</span>
            <TextField
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-52"
              label="Height"
              size="small"
              required
            />
            <Button
              type="submit"
              variant="contained"
              className={resizeLoading ? "pointer-events-none" : ""}
            >
              {resizeLoading ? (
                <CircularProgress className="!text-white" size={24} />
              ) : (
                "Resize"
              )}
            </Button>
          </form>
        </div>
        <div className="mt-6">
          <h2 className="text-lg flex items-center gap-2 text-gray-700 font-medium">
            Your Resizes:{" "}
            <span>
              {" "}
              <IoReload
                className="cursor-pointer"
                onClick={() => fetchVideos()}
              />{" "}
            </span>{" "}
          </h2>
          {video.resizes && Object.keys(video.resizes).length ? (
            renderResizes()
          ) : (
            <p className="text-gray-600">
              You haven&apos;t resized this video yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
