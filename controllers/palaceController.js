const Palace=require("../models/palaceModels")
const createPalace=async (req,res)=>{
    try{
        const {
        owner,
        Images,
        name,
        location,
        description,
        price,
        capacity,
        facilities,
        isAvailable,
        status
    }=req.body;
    const palace=await Palace.create({
        owner,
        Images,
        name,
        location,
        description,
        price,
        capacity,
        facilities,
        isAvailable,
        status
    })
    res.status(200).json({
        success:true,
        message:"palace is created succesfuly"
    })
    }catch(err){
        res.status(400).json({
            success:false,
            message:"faild create to create palace"
        })
    }
    
}
const getPalace=(req,res)=>{
    res.status(200).json({
        success:true,
        message:"All Palace shown"
    })
}
const getPalaceById=(req,res)=>{
    res.status(200).json({
        success:true,
        message:"Specific palace is shown"
    })
}
const updatePalace=(req,res)=>{
    res.status(200).json({
        success:true,
        message:"palace update succesfuly"
    })
}
const deletePalace=(req,res)=>{
    res.status(200).json({
        success:true,
        message:"paace delete succesfully"
    })
}

module.exports={createPalace,getPalace,getPalaceById,updatePalace,deletePalace}


