const NodeRoute = require("@ah_naf/noderoute");
const cors = require("cors"); // Import the cors package
const path = require("path");
const ApiRoute = require("./router");
const { serverIndex } = require("./middleware");
const PORT = 8060;
const server = new NodeRoute();

server.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173"],
  })
);

server.use(serverIndex);

const HomeRoute = server.route("/");
HomeRoute.sendStatic("./public");

// --------- API ROUTE ----------- //
ApiRoute(server);

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
