const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);
const getUser = (req, res) => {
    res.send("user show");
}

const createUser = async (req, res) => {
    try {
        const { name, mobileno, email, password, role } = req.body;

        if (!name || !mobileno || !email || !password) {
            return res.status(400).json({ success: false, message: "the user have not full credential" })
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
            isProfileComplete: true,
            emailVerified: false,
            password: hashedPassword,
            role,
        })
        console.log("after user created :", user)
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
        }).select("+password");

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
                tokenType: "access",
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
                isProfileComplete: user.isProfileComplete,
            }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err
        })
    }
}
const googleAuth = async (req, res) => {
    console.log("google auth")
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
        }

        if (!process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }
        console.log("credentials=", credential)
        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        console.log("ticket", ticket)
        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or unverified Google account",
            });
        }

        const googleId = payload.sub;

        const email = payload.email.trim().toLowerCase();

        // Find existing Google account
        let user = await User.findOne({ googleId });
        if (user && !user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }
        // Prevent automatic linking to an existing manual account
        if (!user) {
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered. Please log in using your existing account.",
                });
            }
        }

        // Existing, fully completed Google user
        if (user && user.isProfileComplete) {
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: "Your account is inactive",
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id.toString(),
                    role: user.role,
                    tokenType: "access",
                },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.status(200).json({
                success: true,
                token,
                isProfileComplete: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    mobileno: user.mobileno,
                    role: user.role,
                    profilePic: payload.picture,
                    isProfileComplete: true,
                },
            });
        }

        // New or incomplete Google user
        const googleProfileToken = jwt.sign(
            {
                tokenType: "google-profile",
                googleId,
                email,
                name: payload.name || "",
                profilePic: payload.picture || null,
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        return res.status(200).json({
            success: true,
            isProfileComplete: false,
            requiresProfileCompletion: true,
            token: googleProfileToken,
            googleUser: {
                name: payload.name || "",
                email,
                profilePic: payload.picture || null,
            },
        });

    } catch (error) {
        console.error("Google authentication error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed",
        });
    }
};
const completeGoogleProfile = async (req, res) => {
    try {
        const { name, mobileno, password, role } = req.body;

        const googleProfile = req.googleProfile;

        if (!googleProfile) {
            return res.status(401).json({
                success: false,
                message: "Google verification is required",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }

        // Validate required fields
        if (
            !name?.trim() ||
            !mobileno ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields",
            });
        }

        if (!/^[0-9]{10}$/.test(mobileno)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit mobile number",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        // Only user and owner can be selected here
        if (!["user", "owner"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid role",
            });
        }

        // Check whether this mobile number is already registered
        const existingMobile = await User.findOne({ mobileno });

        if (existingMobile) {
            return res.status(409).json({
                success: false,
                message: "Mobile number is already registered",
            });
        }

        // Hash the password chosen for WeddingPlanner
        const hashedPassword = await bcrypt.hash(password, 12);

        // Support existing incomplete Google records
        let user = await User.findOne({
            googleId: googleProfile.googleId,
        });

        if (user && user.isProfileComplete) {
            return res.status(409).json({
                success: false,
                message: "Your profile is already complete",
            });
        }

        if (!user) {
            user = new User({
                name: name.trim(),
                email: googleProfile.email,
                googleId: googleProfile.googleId,
                profilePic: googleProfile.profilePic,
                emailVerified: true,
                password: hashedPassword,
                mobileno,
                role,
                isActive: true,
                isProfileComplete: true,
            });
        } else {
            // Complete an existing incomplete Google account
            user.name = name.trim();
            user.mobileno = mobileno;
            user.password = hashedPassword;
            user.role = role;
            user.isProfileComplete = true;
        }

        await user.save();

        // Issue normal login token after successful completion
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
                tokenType: "access",
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Profile completed successfully",
            token,
            isProfileComplete: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileno: user.mobileno,
                role: user.role,
                profilePic: user.profilePic,
                isProfileComplete: true,
            },
        });

    } catch (error) {
        console.error(
            "Profile completion error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to complete profile",
        });
    }
};

module.exports = { createUser, getUser, updateUser, deleteUser, checkUser, googleAuth, completeGoogleProfile, }