const Express = require("express");
const app = Express();

require("dotenv").config(); // .env setup
const cookieParser = require("cookie-parser"); // parsing cookies

// Basic middleware
app.use(Express.urlencoded()); // HTML forms parse
app.use(Express.json()); // JSON parse
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} on ${req.url}`);
  next();
});

//Cookie Auth mount
const { loginAuth } = require("./middleware/jwtAuth");

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
