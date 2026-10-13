const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddelware");
const allowRoles = require("../middleware/roleMiddelware")
const { createUser, getUser, updateUser, deleteUser, checkUser } = require("../controllers/userController")
router.get(
    "/protected-owner",
    authMiddleware,
    allowRoles("owner"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Owner access granted",
            user: req.user,
        });
    }
);
router.post("/", createUser)
router.delete("/:id", deleteUser)
router.patch("/:id", updateUser)
router.get("/", getUser)
router.post("/login", checkUser)
module.exports = router