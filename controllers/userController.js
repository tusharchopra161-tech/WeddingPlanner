const User= require("../models/userModels");
const getUser=(req,res)=>{
    res.send("user show");
}
const createUser=async(req,res)=>{
    try{
        const {name,mobileno,email,password}=req.body;
    if(name==""&&mobileno==""&&email==""&&password==""){
        res.status(301).json({success:false,message:"the user have not full credential"})
    }
    console.log("data collect",name,email,mobileno,password);
    const user=await User.create({
        name,
        email,
        mobileno,
        password
    })
    res.status(200).json({success:true,message:"user created successfuly"});
    }catch(err){
        res.status(400).json({
            success:false,
            message:err
        })
    }
}
const updateUser=(req,res)=>{

}
const deleteUser=(req,res)=>{

}
const checkUser=async (req,res)=>{
    try{
        const {name,password}=req.body;
        console.log(name,password)
        const check=await User.findOne({name,password})
        if(check){
           return res.status(200).json({
                success:true,
                message:"login Successful",
                user:{name:check.name,id:check._id}
            })
        }
        res.status(400).json({
            success:false,
            message:"User not exist"
        })

    }catch(err){
        res.status(500).json({
            success:false,
            message:err
        })
    }
}
 module.exports={createUser,getUser,updateUser,deleteUser,checkUser}