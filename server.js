const Express = require("express");
const app = Express();
require("dotenv").config();
const session = require("express-session");

const cookieParser = require("cookie-parser");

// Basic middleware
app.use(Express.urlencoded());
app.use(Express.json());
app.use(cookieParser());

//Session tracking
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

//Cookie Auth mount
const { loginAuth } = require("./middleware/cookieAuth");

//Main routes
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
app.use("/auth", authRoutes);
app.use("/api", loginAuth, apiRoutes);

//Testing HTML
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/dev.html");
});

const server = app.listen(process.env.PORT || "8080", () => {
  console.log(`Server listening on ${server.address().port}`);
});
