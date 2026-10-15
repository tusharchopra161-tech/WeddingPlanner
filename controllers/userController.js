const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getUser = (req, res) => {
    res.send("user show");
}

const createUser = async (req, res) => {
    try {

        const { name, mobileno, email, password, role } = req.body;
        if (name == "" && mobileno == "" && email == "" && password == "") {
            res.status(301).json({ success: false, message: "the user have not full credential" })
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            mobileno,
            password: hashedPassword,
            role,
            isActive,
            subsciption
        })
        res.status(200).json({ success: true, message: "user created successfuly" });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err
        })
    }
}
const updateUser = (req, res) => {

}
const deleteUser = (req, res) => {

}
const checkUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid name or password",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid name or password",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        return res.status(200).json({
            success: true,
            token,
            message: "login Successful",
            user: {
                _id: user._id,
                name: user.name,
                mobileno: user.mobileno,
                email: user.email,
                role: user.role,
            }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err
        })
    }
}
module.exports = { createUser, getUser, updateUser, deleteUser, checkUser }