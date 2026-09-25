const getUser=(req,res)=>{
    res.send("user show");
}
const createUser=(req,res)=>{
    const data=req.body;
    console.log("data collect",data);
    res.status(200).json({success:true,message:"user created successfuly"});
}
const updateUser=(req,res)=>{

}
const deleteUser=(req,res)=>{

}
 module.exports={createUser,getUser,updateUser,deleteUser}