const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddelware");
const allowRoles = require("../middleware/roleMiddelware")
const googleProfileMiddleware = require("../middleware/googleProfileMiddleware")
const googleLinkMiddleware =require("../middleware/googleLinkMiddleware")
const { createUser, getUser, updateUser, deleteUser, checkUser,googleAuth,completeGoogleProfile,linkGoogleAccount } = require("../controllers/userController")
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
router.post("/google-link",googleLinkMiddleware,linkGoogleAccount);
module.exports = router