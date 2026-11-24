const jwt = require("jsonwebtoken");

const googleProfileMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Google verification token is required",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            decoded.tokenType !== "google-profile" ||
            !decoded.googleId ||
            !decoded.email
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid Google profile token",
            });
        }

        req.googleProfile = {
            googleId: decoded.googleId,
            email: decoded.email,
            name: decoded.name,
            profilePic: decoded.profilePic || null,
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Google verification token is invalid or expired",
        });
    }
};

module.exports = googleProfileMiddleware;