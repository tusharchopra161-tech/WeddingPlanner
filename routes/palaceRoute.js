const { createPalace, getPalace, getPalaceById, updatePalace, deletePalace } = require("../controllers/palaceController");

const router=require("express").Router();

router.post("/",createPalace)
router.get("/",getPalace)
router.get("/:id",getPalaceById)
router.patch("/:id",updatePalace)
router.delete("/:id",deletePalace)
module.exports=router;