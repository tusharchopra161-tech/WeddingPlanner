const router=require("express").Router();
const {createUser,getUser,updateUser,deleteUser, checkUser}=require("../controllers/userController")
router.post("/",createUser)
router.delete("/:id",deleteUser)
router.patch("/:id",updateUser)
router.get("/",getUser)
router.post("/login",checkUser)
module.exports=router