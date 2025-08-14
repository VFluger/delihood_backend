const Express = require("express");
const app = Express();

require("dotenv").config(); // .env setup
const cookieParser = require("cookie-parser"); // parsing cookies

// Basic middleware
app.use(Express.urlencoded()); // HTML forms parse
app.use(Express.json()); // JSON parse
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} on ${req.url} from ${req.ip}`);
  console.log("BODY: ");
  console.log(req.body);
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

app.get("/testing-data", (req, res) => {
  res.send({
    success: true,
    data: [
      {
        id: 1,
        name: "Chef Antonín Novák",
        location_lat: 50.088,
        location_lng: 14.42,
        foods: [
          {
            id: 1,
            name: "Pho Bo",
            description: "Vietnamese beef noodle soup with fresh herbs.",
            category: "asian",
            price: 180,
            imageUrl: "https://picsum.photos/id/1011/600/400",
          },
          {
            id: 2,
            name: "Pad Thai",
            description: "Thai stir-fried noodles with shrimp and peanuts.",
            category: "asian",
            price: 150,
            imageUrl: "https://picsum.photos/id/1025/600/400",
          },
          {
            id: 3,
            name: "Green Curry",
            description:
              "Spicy Thai green curry with chicken and coconut milk.",
            category: "asian",
            price: 170,
            imageUrl: "https://picsum.photos/id/1080/600/400",
          },
        ],
      },
      {
        id: 2,
        name: "Giovanni Rossi",
        location_lat: 45.465,
        location_lng: 9.19,
        foods: [
          {
            id: 4,
            name: "Margherita Pizza",
            description:
              "Classic Neapolitan pizza with fresh mozzarella and basil.",
            category: "italien",
            price: 220,
            imageUrl: "https://picsum.photos/id/1084/600/400",
          },
          {
            id: 5,
            name: "Spaghetti Carbonara",
            description:
              "Pasta with pancetta, egg, pecorino cheese, and black pepper.",
            category: "italien",
            price: 190,
            imageUrl: "https://picsum.photos/id/292/600/400",
          },
        ],
      },
      {
        id: 3,
        name: "Priya Sharma",
        location_lat: 28.6139,
        location_lng: 77.209,
        foods: [
          {
            id: 6,
            name: "Butter Chicken",
            description: "Creamy tomato-based curry with tender chicken.",
            category: "indian",
            price: 210,
            imageUrl: "https://picsum.photos/id/823/600/400",
          },
          {
            id: 7,
            name: "Paneer Tikka",
            description: "Grilled cottage cheese cubes with Indian spices.",
            category: "indian",
            price: 180,
            imageUrl: "https://picsum.photos/id/870/600/400",
          },
          {
            id: 8,
            name: "Masala Chai",
            description: "Spiced Indian tea brewed with milk and sugar.",
            category: "drink",
            price: 60,
            imageUrl: "https://picsum.photos/id/866/600/400",
          },
        ],
      },
      {
        id: 4,
        name: "Jan Koudelka",
        location_lat: 49.195,
        location_lng: 16.608,
        foods: [
          {
            id: 9,
            name: "Svíčková",
            description:
              "Czech marinated beef sirloin with creamy vegetable sauce.",
            category: "czech",
            price: 195,
            imageUrl: "https://picsum.photos/id/697/600/400",
          },
        ],
      },
      {
        id: 5,
        name: "FastBite Express",
        location_lat: 40.7128,
        location_lng: -74.006,
        foods: [
          {
            id: 10,
            name: "Cheeseburger",
            description: "Juicy beef patty with cheddar cheese and pickles.",
            category: "quick_cheap",
            price: 120,
            imageUrl: "https://picsum.photos/id/1080/600/400",
          },
          {
            id: 11,
            name: "French Fries",
            description: "Crispy golden fries served with ketchup.",
            category: "quick_cheap",
            price: 60,
            imageUrl: "https://picsum.photos/id/1084/600/400",
          },
          {
            id: 12,
            name: "Cola",
            description: "Chilled fizzy drink.",
            category: "drink",
            price: 45,
            imageUrl: "https://picsum.photos/id/870/600/400",
          },
          {
            id: 13,
            name: "Chicken Wrap",
            description: "Grilled chicken wrap with fresh vegetables.",
            category: "quick_cheap",
            price: 110,
            imageUrl: "https://picsum.photos/id/292/600/400",
          },
        ],
      },
    ],
  });
});

// Listen setup
const server = app.listen(process.env.PORT || "8080", () => {
  console.log(`Server listening on ${server.address().port}`);
});
