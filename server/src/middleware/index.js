const DB = require("../DB");

exports.verify = (req, res, next) => {
  if (req.headers.cookie) {
    let token = req.headers.cookie.split(";");
    token = token[token.length - 1].split("=")[1];

    DB.update();
    const session = DB.sessions.find((session) => session.token === token);
    if (session) {
      req.userId = session.userId;
      return next();
    }
  }
  return res.status(401).json({ error: "Unauthrorized" });
};

exports.serverIndex = (req, res, next) => {
  const routes = ["/", "/login", "/profile"];
  if (routes.indexOf(req.url) !== -1 && req.method === "GET") {
    return res.status(200).sendFile("./public/index.html", "text/html");
  } else {
    next();
  }
};
