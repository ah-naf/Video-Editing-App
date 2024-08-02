import React, { useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AppContext } from "../main";
import t from "../assets/util";
import toast from "react-hot-toast";

const Header = () => {
  const { loggedIn, setLoggedIn, section, setSection } = useContext(AppContext);
  const navigate = useNavigate();

  const checkLoggedIn = async () => {
    try {
      /** @API call */
      await axios.get("http://localhost:8060/api/user", {
        withCredentials: "include",
      });
      setLoggedIn(true);
    } catch (e) {
      setLoggedIn(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!loggedIn) checkLoggedIn();
  }, [loggedIn]);

  useEffect(() => {
    setSection(window.location.pathname);
  }, [section]);

  const logout = async () => {
    try {
      /** @API call */
      await axios.delete("http://localhost:8060/api/logout", {
        withCredentials: "include",
      });
      setLoggedIn(false);
      setSection("/");
      toast.success(t.alert.success.auth.loggedOut);
    } catch (e) {
      toast.error(t.alert.error.default);
    }
  };

  return (
    <div className="bg-white flex items-center justify-between p-4 px-8">
      <div>
        <Link
          className="text-xl tracking-wider font-semibold uppercase text-blue-500"
          to="/"
          onClick={() => {
            setSection("/");
          }}
        >
          Home
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {section !== "/login" && !loggedIn && (
          <Link
            className="hover:underline"
            to="/login"
            onClick={() => {
              setSection("/login");
            }}
          >
            Login
          </Link>
        )}

        {section !== "/register" && !loggedIn && (
          <Link
            className="hover:underline"
            to="/register"
            onClick={() => {
              setSection("/register");
            }}
          >
            Regsiter
          </Link>
        )}

        {loggedIn && (
          <Link
            className="hover:underline"
            to="/"
            onClick={() => {
              logout();
            }}
          >
            Logout
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;
