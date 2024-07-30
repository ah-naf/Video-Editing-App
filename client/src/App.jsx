import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "./Page/Home";
import Login from "./Page/Login";
import Header from "./Components/Header";
import Register from "./Page/Register";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="bg-blue-50 min-h-screen">
      <Toaster />
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
