const express=require("express")
const app=express()
const dotenv=require("dotenv");
dotenv.config()
app.use(express.json())
const connectDB=require("./config/db")
 connectDB()
    
module.exports=app