import React, { useState, useEffect, useContext } from "react";

import axios from "axios";
import t from "../assets/util";
import { AppContext } from "../main";
import toast from "react-hot-toast";

const useVideo = (videoId) => {
  const { videos, setVideos } = useContext(AppContext); // the complete list of videos
  const [loading, setLoading] = useState(true); // loading for fetching the videos
  const [video, setVideo] = useState({}); // selected video for the modal
  const [cropSuccess, setCropSuccess] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  const deleteVideo = async (videoId) => {
    console.log(videoId);
    const allVideos = [...videos];
    try {
      const filteredVideos = allVideos.filter(
        (video) => video.videoId !== videoId
      );
      setVideos(filteredVideos);
      await axios.delete(`http://localhost:8060/api/video?videoId=${videoId}`, {
        withCredentials: "include",
      });
      toast.success("Video deleted successfully!");
    } catch (e) {
      toast.error("Failed to delete video. Please try again later.");
      setVideos(allVideos);
    }
  };

  const addFormat = (format) => {
    // Find the video in videos and add the resize to it, with processing set to true
    const updatedVideos = videos.map((video) => {
      if (video.videoId === videoId) {
        if (video.format) {
          return toast.error("Selected format is already exist.");
        } else {
          return {
            ...video,
            formats: {
              ...video.formats,
              [format]: {
                processing: true,
              },
            },
          };
        }
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  const cropVideo = async (option) => {
    try {
      setIsCropping(true);
      setCropSuccess(false);
      await axios.put(
        "http://localhost:8060/api/video/crop",
        {
          videoId,
          ...option,
        },
        { withCredentials: "include" }
      );

      toast.success("Video cropped successfully");
      setCropSuccess(true);
    } catch (error) {
      toast.error("Failed to crop the video. Please try again later.");
    } finally {
      setIsCropping(false);
    }
  };

  const deleteResize = async (dimension) => {
    try {
      await axios.delete(
        `http://localhost:8060/api/video/resize?videoId=${videoId}&dimension=${dimension}`,
        { withCredentials: "include" }
      );
      toast.success("The resized video is deleted successfully");
      fetchVideos();
    } catch (error) {
      toast.error(t.alert.error.default);
    }
  };

  const deleteFormat = async (format) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:8060/api/video/change-format?videoId=${videoId}&format=${format}`,
        { withCredentials: "include" }
      );
      if (data.status === "success")
        toast.success("The formatted video is deleted successfully");
      else toast.error(data.message);
      fetchVideos();
    } catch (error) {
      toast.error(t.alert.error.default);
    }
  };

  const deleteTrim = async (filename) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:8060/api/video/trim?videoId=${videoId}&filename=${filename}`,
        { withCredentials: "include" }
      );
      if (data.status === "success")
        toast.success("The trimmed video is deleted successfully");
      else toast.error(data.message);
      fetchVideos();
    } catch (error) {
      toast.error(t.alert.error.default);
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      /** @API call */
      const { data } = await axios.get("http://localhost:8060/api/videos", {
        withCredentials: "include",
      });
      setVideos(data);
    } catch (e) {
      toast.error(t.alert.error.default);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (videoId) {
      const selectedVideo = videos.find((video) => video.videoId === videoId);
      setVideo(selectedVideo);
    } else {
      setVideo({});
    }
    setCropSuccess(false);
    setIsCropping(false);
  }, [videoId, videos]);

  const addResize = (width, height) => {
    // Find the video in videos and add the resize to it, with processing set to true
    const updatedVideos = videos.map((video) => {
      if (video.videoId === videoId) {
        return {
          ...video,
          resizes: {
            ...video.resizes,
            [`${width}x${height}`]: {
              processing: true,
            },
          },
        };
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  const extractedAudioTrue = (videoId) => {
    const updatedVideos = videos.map((video) => {
      if (video.videoId === videoId) {
        return {
          ...video,
          extractedAudio: true,
        };
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  return {
    videos,
    loading,
    fetchVideos,
    video,
    addResize,
    extractedAudioTrue,
    deleteVideo,
    deleteResize,
    cropVideo,
    cropSuccess,
    setCropSuccess,
    isCropping,
    setIsCropping,
    addFormat,
    deleteFormat,
    deleteTrim
  };
};

export default useVideo;
