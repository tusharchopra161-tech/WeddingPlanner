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
        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
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
        // Existing manual account: require password verification
        if (!user) {
            const existingUser = await User.findOne({ email }).select("+password");

            if (existingUser) {
                if (!existingUser.isActive) {
                    return res.status(403).json({
                        success: false,
                        message: "Your account is inactive",
                    });
                }

                // This account must have a password to link Google
                if (!existingUser.password) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "This account cannot be linked using a password. Please contact support.",
                    });
                }

                // Temporary token for the account-linking process
                const googleLinkToken = jwt.sign(
                    {
                        tokenType: "google-link",
                        googleId,
                        email,
                        name: payload.name || "",
                        profilePic: payload.picture || null,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "2m" }
                );

                return res.status(200).json({
                    success: true,
                    requiresAccountLink: true,
                    message:
                        "Please verify your existing password to link your Google account.",

                    googleLinkToken,

                    googleProfile: {
                        name: payload.name || "",
                        email,
                        profilePic: payload.picture || null,
                    },
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
            if (payload.picture) {
                user.profilePic = payload.picture;
                await user.save();
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
                    profilePic: payload.picture || user.profilePic,
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
const linkGoogleAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const googleLink = req.googleLink;

        if (!googleLink) {
            return res.status(401).json({
                success: false,
                message: "Google verification is required",
            });
        }

        if (!password?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your Wedding Planner password",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured",
            });
        }

        // Load the existing account's password for bcrypt verification.
        const user = await User.findOne({
            email: googleLink.email,
        }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Unable to verify this account",
            });
        }

        // Do not overwrite a Google account already linked to this user.
        if (user.googleId && user.googleId !== googleLink.googleId) {
            return res.status(409).json({
                success: false,
                message: "This account is already linked to another Google account",
            });
        }

        // Prevent the same Google account from being linked to a different user.
        const googleAccountInUse = await User.findOne({
            googleId: googleLink.googleId,
            _id: { $ne: user._id },
        });

        if (googleAccountInUse) {
            return res.status(409).json({
                success: false,
                message: "This Google account is already linked to another account",
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account does not have a password to verify",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Incorrect Wedding Planner password",
            });
        }

        // Link Google without changing the existing account's role or profile.
        user.googleId = googleLink.googleId;
        user.isProfileComplete = true;
        if (googleLink.profilePic) {
            user.profilePic = googleLink.profilePic;
        }

        await user.save();

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
            message: "Google account linked successfully",
            token,
            isProfileComplete: user.isProfileComplete,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileno: user.mobileno,
                role: user.role,
                profilePic: user.profilePic,
                isProfileComplete: user.isProfileComplete,
            },
        });
    } catch (error) {
        console.error("Google account linking error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to link Google account",
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

module.exports = { createUser, getUser, updateUser, deleteUser, checkUser, googleAuth, completeGoogleProfile,linkGoogleAccount}