const {getMyPalace,createPalace, getPalace, getPalaceById, updatePalace, deletePalace, updatePalaceStatus,getPendingPalaces,updatePalaceAvailability} = require("../controllers/palaceController");
const router=require("express").Router();
const authMiddleware = require("../middleware/authMiddelware");
const allowRoles = require("../middleware/roleMiddelware");
const upload = require("../middleware/uploadMiddelware")
router.get("/my",authMiddleware,allowRoles("owner"),getMyPalace);
router.post("/",authMiddleware,allowRoles("owner"),upload.array("Images",10),createPalace);
router.get("/",getPalace)
router.get("/pending",authMiddleware, allowRoles("admin"),getPendingPalaces);
router.get("/:id",getPalaceById)
router.patch("/:id",authMiddleware,allowRoles("owner"),updatePalace)
router.delete("/:id",authMiddleware,allowRoles("admin"),deletePalace)
router.patch("/:id/status",authMiddleware,allowRoles("admin"),updatePalaceStatus);
router.patch("/:id/availability",authMiddleware,allowRoles("owner"),updatePalaceAvailability);
module.exports=router;