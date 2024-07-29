import { Button, Skeleton, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import useVideo from "../Hooks/useVideo";
import axios from "axios";
import toast from "react-hot-toast";
import t from "../assets/util";
import { IoMdClose } from "react-icons/io";
import ResizeModal from "./ResizeModal";
import CropModal from "./CropModal";
import ChangeFormatModal from "./ChangeFormatModal";

function VideoList() {
  const {
    videos: allVideos,
    fetchVideos,
    deleteVideo,
    extractedAudioTrue,
    loading,
  } = useVideo();
  const [extractAudioLoading, setExtractAudioLoading] = useState(null);
  const [resizeModal, setResizeModal] = useState(null);
  const [cropModal, setCropModal] = useState(null);
  const [changeFormatModal, setChangeFormatModal] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const extractAudio = async (videoId) => {
    setExtractAudioLoading(videoId);

    try {
      /** @API call */
      await axios.put(
        `http://localhost:8060/api/video/extract-audio?videoId=${videoId}`,
        {
          videoId,
        },
        { withCredentials: "include" }
      );
      toast.success(t.alert.success.video.audioExtracted);
      extractedAudioTrue(videoId);
    } catch (e) {
      toast.error(t.alert.error.default);
    }

    setExtractAudioLoading(false);
  };

  return (
    <>
      <div className="mt-10">
        {allVideos.length === 0 && !loading ? (
          <h1 className="text-3xl text-center font-bold text-gray-700 mb-8">
            No video found. Upload a video first...
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold mb-4">Your Videos</h1>
        )}
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="rectangular" className="shadow" height={150} />
            <Skeleton variant="rectangular" className="shadow" height={150} />
          </div>
        ) : (
          <div className="space-y-4">
            {allVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-6 bg-white p-4 rounded shadow relative group"
              >
                <img
                  className="w-40 object-cover rounded shadow"
                  src={`http://localhost:8060/get-video-asset?videoId=${video.videoId}&type=thumbnail`}
                />
                <div>
                  <div className="text-xl font-semibold text-gray-800">
                    {video.name}
                  </div>

                  <div className="text-sm my-1 text-gray-800 font-medium">
                    {video.dimensions.width}x{video.dimensions.height}
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {video.extension.toUpperCase()}
                  </div>
                </div>
                <div className="ml-auto grid grid-cols-2 gap-2 ">
                  <Button
                    onClick={() => setResizeModal(video.videoId)}
                    variant="contained"
                    size="small"
                  >
                    Resize{" "}
                    {video.resizes && (
                      <span className="ml-1 bg-white rounded-full w-4  text-center !text-xs text-gray-700 font-semibold">
                        {Object.keys(video.resizes).length}
                      </span>
                    )}
                  </Button>
                  {video.extractedAudio ? (
                    <Button
                      href={`http://localhost:8060/get-video-asset?videoId=${video.videoId}&type=audio`}
                      variant="contained"
                      className="!bg-green-600"
                      size="small"
                    >
                      Download Audio
                    </Button>
                  ) : (
                    <Button
                      className={
                        extractAudioLoading ? `pointer-events-none` : ""
                      }
                      onClick={() => extractAudio(video.videoId)}
                      variant="contained"
                      size="small"
                    >
                      {extractAudioLoading &&
                      extractAudioLoading === video.videoId ? (
                        <CircularProgress className="!text-white" size={20} />
                      ) : (
                        "Extract Audio"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setCropModal(video.videoId)}
                  >
                    Crop
                  </Button>
                  <Button variant="contained" size="small">
                    Trim
                  </Button>
                  <Button
                    className="col-span-2"
                    variant="contained"
                    size="small"
                    onClick={() => setChangeFormatModal(video.videoId)}
                  >
                    Change Format
                  </Button>
                  <span
                    onClick={() => deleteVideo(video.videoId)}
                    className="hidden group-hover:block bg-red-400 hover:bg-red-500 cursor-pointer absolute top-0 right-0 translate-x-1/2 text-white p-1 rounded-full -translate-y-1/2"
                  >
                    <IoMdClose />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ResizeModal
        videoId={resizeModal}
        handleClose={() => setResizeModal(null)}
      />
      <CropModal videoId={cropModal} handleClose={() => setCropModal(null)} />
      <ChangeFormatModal
        videoId={changeFormatModal}
        handleClose={() => setChangeFormatModal(null)}
      />
    </>
  );
}

export default VideoList;
