const express=require("express")
const app=express()
const dotenv=require("dotenv");
dotenv.config()
const port=process.env.PORT
app.use(express.json())
const connectDB=require("./config/db")
// app.use("/users",userRoutes)
// app.use("/products",productsRoutes)
// app.use("/orders",orderRoutes)
// app.use(errHandleMiddleware)
app.get("/",(req,res)=>{
    res.send("hey this is this is you")
})
app.listen(port,async()=>{
    await connectDB()
    console.log("server listen at 3000")
})