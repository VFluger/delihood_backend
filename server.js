const Express = require("express");
const app = Express();

require("dotenv").config(); // .env setup
const session = require("express-session"); // cookie session
const cookieParser = require("cookie-parser"); // parsing cookies

// Basic middleware
app.use(Express.urlencoded()); // HTML forms parse
app.use(Express.json()); // JSON parse
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
const confirmationsRoutes = require("./routes/confirmations");
app.use("/auth", authRoutes);
app.use("/api", loginAuth, apiRoutes);
app.use("/confirmations", confirmationsRoutes);

//Testing HTML
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/dev.html");
});

// Listen setup
const server = app.listen(process.env.PORT || "8080", () => {
  console.log(`Server listening on ${server.address().port}`);
});
