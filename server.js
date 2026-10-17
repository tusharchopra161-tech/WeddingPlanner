const express=require("express")
const mongoose=require("mongoose")
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/userModels");
const jwt=require("jsonwebtoken");
const cors=require("cors")
const dotenv=require("dotenv");
dotenv.config()

const userRoute=require("./routes/userRoute");
const palaceRoute=require("./routes/palaceRoute")
const bookingRoute=require("./routes/bookingRoutes")
const pushRoute=require("./routes/pushRoutes")
const connectDB=require("./config/db")

const app=express()
const server=http.createServer(app)
const allowedOrigins=["https://weddinplanner-frontend.vercel.app",
        "https://weddinplanner-frontend-jn17qx1fw-tusharchopra161-4346.vercel.app",
        "https://weddinplanner-frontend-5g2i5q8ax-tusharchopra161-4346.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174"
    ]
app.use(cors(
    {origin:allowedOrigins,
        credentials:true
    }))

app.use(express.json())

const io=new Server(server,{
    cors:{
      origin:allowedOrigins,
      methods:["GET","POST","PATCH","DELETE"],
      credentials:true  
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

    if (!user || user.role !== "admin") {
      return next(new Error("Admin access only"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});
// Make io accessible inside controllers through req.app.get("io")
app.set("io", io);
io.on("connection",(socket)=>{
    socket.join("admins")
    console.log("socket connected:",socket.id)

    socket.on("disconnect",()=>{
        console.log("Admin disconnected:",socket.id) 
    })

})

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    console.log("Wedding Planner API is working");
    res.send("Wedding Planner Backend is working");
});
app.use("/user",userRoute);
app.use("/palace",palaceRoute)
app.use("/booking",bookingRoute)
app.use("/push",pushRoute)

const startServer=async()=>{
    try{
        await connectDB();
        console.log("Connected database:", mongoose.connection.name);
        server.listen(port,()=>{
            console.log(`server is running at port: ${port}`)
        })
    }catch(err){
        console.log("server startup failed:",err)
    }
}

// app.listen(port, async () => {
//     await connectDB();
    
//     console.log(`Server running on port ${port}`);
// });
startServer()
module.exports=app