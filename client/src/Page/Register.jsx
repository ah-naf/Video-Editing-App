import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import t from "../assets/util";
import { AppContext } from "../main";
import toast from "react-hot-toast";
import { Button, Input, TextField } from "@mui/material";

const Register = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loggedIn, setLoggedIn, setSection } = useContext(AppContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn) navigate("/");
  }, [loggedIn]);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      /** @API call */
      await axios.post("http://localhost:8060/api/register", {
        username,
        password,
        name: fullName,
      });
      navigate("/login");
      setSection("/login");
      toast.success(t.alert.success.auth.registered);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        toast.error(t.alert.error.auth.badRegisterInfo);
      } else {
        toast.error(t.alert.error.default);
      }
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={onFormSubmit}
      className="flex flex-col max-w-lg mx-auto gap-4 mt-12 bg-[white] rounded shadow p-8 "
    >
      <TextField
        type="text"
        name="name"
        id="name"
        aria-label="name"
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <TextField
        type="text"
        name="username"
        id="username"
        aria-label="username"
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        type="password"
        name="password"
        id="password"
        aria-label="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button disabled={loading} variant="contained" type="submit">
        Register
      </Button>
    </form>
  );
};

export default Register;
