const mongoose =require("mongoose");
const dbUri=process.env.MONGO_URI;

async function connectDb(){
 try{
    const result=await mongoose.connect(dbUri);
    console.log("mongoDB connected successful")
 }catch(err){
    console.log("mongoDb not connected",err)
 }
}
module.exports=connectDb;





