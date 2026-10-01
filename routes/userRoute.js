const router=require("express").Router();
const {createUser,getUser,updateUser,deleteUser, checkUser}=require("../controllers/userController")
router.post("/",createUser)
router.delete("/",deleteUser)
router.patch("/",updateUser)
router.get("/",getUser)
router.post("/login",checkUser)

module.exports=router