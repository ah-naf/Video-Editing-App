import React, { useState, useEffect, useContext } from "react";

import axios from "axios";
import t from "../assets/util";
import { AppContext } from "../main";
import toast from "react-hot-toast";

const useVideo = (videoId) => {
  const { videos, setVideos } = useContext(AppContext); // the complete list of videos
  const [loading, setLoading] = useState(true); // loading for fetching the videos
  const [video, setVideo] = useState({}); // selected video for the modal

  const deleteVideo = async (videoId) => {
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

  const deleteResize = async (dimension) => {
    try {
      await axios.delete(
        `http://localhost:8060/api/video/resize-delete?videoId=${videoId}&dimension=${dimension}`,
        { withCredentials: "include" }
      );
      toast.success("The resized video is deleted successfully");
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
  };
};

export default useVideo;
