// Controllers
const User = require("./controllers/user");
const { verify } = require("./middleware");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("/api/login").post(User.logUserIn);

  server.route("/api/register").post(User.registerUser);

  // Log a user out
  server.route("/api/logout").delete(verify, User.logUserOut);

  // Send user info
  const UserInfoRoute = server.route("/api/user");
  UserInfoRoute.use(verify)
  UserInfoRoute.get(User.sendUserInfo);

  // Update a user info
  UserInfoRoute.put(User.updateUser);
};
