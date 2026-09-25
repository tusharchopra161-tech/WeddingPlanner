const router=require("express").Router();
const {createUser,getUser,updateUser,deleteUser}=require("../controllers/userController")
router.post("/",createUser)
router.delete("/",deleteUser)
router.patch("/",updateUser)
router.get("/",getUser)

module.exports=router