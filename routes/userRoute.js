const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddelware");
const allowRoles = require("../middleware/roleMiddelware")
const googleProfileMiddleware = require("../middleware/googleProfileMiddleware")
const { createUser, getUser, updateUser, deleteUser, checkUser,googleAuth,completeGoogleProfile } = require("../controllers/userController")
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
router.post("/login", checkUser)

router.get("/", getUser)
router.patch("/:id", updateUser)
router.delete("/:id", deleteUser)

router.post("/google-auth", googleAuth);
router.post("/complete-profile",googleProfileMiddleware,completeGoogleProfile);
module.exports = router