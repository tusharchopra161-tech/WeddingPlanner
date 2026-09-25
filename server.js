const express=require("express")
const userRoute=require("./routes/userRoute")
const cors=require("cors")
const app=express()
const dotenv=require("dotenv");
dotenv.config()
app.use(cors({origin:"http://localhost:5173"}))
app.use(express.json())
const connectDB=require("./config/db")
const port = process.env.PORT || 3000;
    app.get("/", (req, res) => {
    console.log("Wedding Planner API is working");
    res.send("Wedding Planner Backend is working");
});
app.use("/user",userRoute);
app.listen(port, async () => {
    await connectDB();
    console.log(`Server running on port ${port}`);
});
module.exports=app