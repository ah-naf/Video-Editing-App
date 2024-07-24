import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

export const AppContext = createContext(null);

function Main() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [section, setSection] = useState("");
  const [videos, setVideos] = useState([]);
  return (
    <AppContext.Provider
      value={{
        videos,
        setVideos,
        loggedIn,
        setLoggedIn,
        section,
        setSection,
      }}
    >
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </AppContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
