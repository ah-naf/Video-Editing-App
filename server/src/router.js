// Controllers
const User = require("./controllers/user");
const Video = require("./controllers/video");
const { verify } = require("./middleware");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ***************** USER ROUTES ****************** //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("/api/login").post(User.logUserIn);

  server.route("/api/register").post(User.registerUser);

  // Log a user out
  server.route("/api/logout").delete(verify, User.logUserOut);

  // User details
  const UserInfoRoute = server.route("/api/user");
  UserInfoRoute.use(verify).get(User.sendUserInfo).put(User.updateUser);

  // ------------------------------------------------ //
  // **************** VIDEO ROUTES *****************  //
  // ------------------------------------------------ //

  server.route("/api/videos").get(verify, Video.getVideos);

  server.route("/api/video").delete(verify, Video.deleteVideo);

  server.route("/api/upload-video").post(verify, Video.uploadVideo);

  server.route("/api/video/extract-audio").put(verify, Video.extractAudio);

  server.route("/api/video/resize").put(verify, Video.resizeVideo);

  server.route("/api/video/crop").put(verify, Video.cropVideo);

  server.route("/api/video/change-format").put(verify, Video.changeFormat);

  server.route("/api/video/resize-delete").delete(verify, Video.deleteResize);

  server.route("/get-video-asset").get(Video.getVideoAsset);
};
