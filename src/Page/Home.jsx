import React, { useContext, useEffect } from "react";
import Uploader from "../Components/Uploader";
import { Toaster } from "react-hot-toast";
import { AppContext } from "../main";
import { useNavigate } from "react-router";
import VideoList from "../Components/VideoList";

function Home() {
  const { loggedIn, setSection } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-10">
      <Uploader />
      <VideoList />
    </div>
  );
}

export default Home;
