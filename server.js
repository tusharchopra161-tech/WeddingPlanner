const cron = require("node-cron");
const express = require("express")
const mongoose = require("mongoose")
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/userModels");
const jwt = require("jsonwebtoken");
const cors = require("cors")
const dotenv = require("dotenv");
dotenv.config()

const {expirePendingBookings}=require("./controllers/bookingController")
const userRoute = require("./routes/userRoute");
const palaceRoute = require("./routes/palaceRoute")
const bookingRoute = require("./routes/bookingRoutes")
const pushRoute = require("./routes/pushRoutes")
const notificationRoute=require("./routes/notificationRoutes")
const connectDB = require("./config/db")

const app = express()
const server = http.createServer(app)
const allowedOrigins = ["https://weddinplanner-frontend.vercel.app",
    "https://weddinplanner-frontend-jn17qx1fw-tusharchopra161-4346.vercel.app",
    "https://weddinplanner-frontend-5g2i5q8ax-tusharchopra161-4346.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
]
app.use(cors(
    {
        origin: allowedOrigins,
        credentials: true
    }))

app.use(express.json())

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
})
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.userId || decoded.id || decoded._id;

        if (!userId) {
            return next(new Error("Invalid token payload"));
        }
        const user = await User.findById(userId);

        if (!user ||!["admin","owner","user"].includes(user.role) ) {
            return next(new Error("access denied"));
        }
        socket.user = user;
        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});
// Make io accessible inside controllers through req.app.get("io")
app.set("io", io);
io.on("connection", (socket) => {
    const user = socket.user;
    const userId = user._id.toString();
    // Admins receive admin notifications
    if (user.role === "admin") {
        socket.join("admins");
        console.log("Admin socket connected:", socket.id);
    }

    // Owners receive updates only for their own palaces
    if (user.role === "owner") {
        socket.join(`owner:${user._id.toString()}`);
        console.log("Owner socket connected:", socket.id);
    }
    if (user.role === "user") {
        socket.join(`user:${userId}`);
        console.log("Customer socket connected:", socket.id);
    }
    socket.on("disconnect", () => {
        console.log(`${user.role} disconnected:`, socket.id);
    })

})

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    console.log("Wedding Planner API is working");
    res.send("Wedding Planner Backend is working");
});
app.use("/user", userRoute);
app.use("/palace", palaceRoute)
app.use("/booking", bookingRoute)
app.use("/push", pushRoute)
app.use("/notifications",notificationRoute)

const startServer = async () => {
  try {
    await connectDB();
    console.log("Connected database:", mongoose.connection.name);

    // Process any overdue bookings when the server starts.
    await expirePendingBookings(null, io);

    // Check for expired booking holds every minute.
    cron.schedule("* * * * *", async () => {
      try {
        await expirePendingBookings(null, io);
      } catch (error) {
        console.error("Automatic booking expiry failed:", error);
      }
    });

    console.log("Booking expiry scheduler started.");

    server.listen(port, () => {
      console.log(`server is running at port: ${port}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
  }
};

// app.listen(port, async () => {
//     await connectDB();

//     console.log(`Server running on port ${port}`);
// });
startServer()
module.exports = app