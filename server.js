const express=require("express")
const mongoose=require("mongoose")
const userRoute=require("./routes/userRoute");
const palaceRoute=require("./routes/palaceRoute")
const bookingRoute=require("./routes/bookingRoutes")
const cors=require("cors")
const app=express()
const dotenv=require("dotenv");
dotenv.config()
app.use(cors(
    {origin:["https://weddinplanner-frontend.vercel.app",
        "https://weddinplanner-frontend-jn17qx1fw-tusharchopra161-4346.vercel.app",
        "https://weddinplanner-frontend-5g2i5q8ax-tusharchopra161-4346.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
        credentials:true
    }))
app.use(express.json())
const connectDB=require("./config/db")
const port = process.env.PORT || 3000;
    app.get("/", (req, res) => {
    console.log("Wedding Planner API is working");
    res.send("Wedding Planner Backend is working");
});
app.use("/user",userRoute);
app.use("/palace",palaceRoute)
app.use("/booking",bookingRoute)

app.listen(port, async () => {
    await connectDB();
    console.log("Connected database:", mongoose.connection.name);
    console.log(`Server running on port ${port}`);
});
module.exports=app