const express=require("express")
const app=express()
const dotenv=require("dotenv");
dotenv.config()
app.use(express.json())
const connectDB=require("./config/db")
 connectDB()
    app.get("/", (req, res) => {
    console.log("Wedding Planner API is working");
    res.send("Wedding Planner Backend is working");
});
module.exports=app