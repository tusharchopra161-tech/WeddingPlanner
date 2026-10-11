const mongoose =require("mongoose");
const dbUri=process.env.MONGO_URI;

async function connectDb(){
 try{
    const result=await mongoose.connect(dbUri);
    console.log("MongoDB connected:", mongoose.connection.name);
    console.log("mongoDB connected successful")
 }catch(err){
    console.error("MongoDB connection failed:", err.message);
   console.log("mongoDb not connected",err)
 }
}
module.exports=connectDb;





