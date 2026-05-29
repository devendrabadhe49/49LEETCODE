const redisClient = require('../config/redis');
const User = require('../models/user');
const validate = require('../utill/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Submission = require('../models/submission');


const getTokenFromRequest = (req) => {
    const authHeader = req.headers?.authorization;
    const cookieToken = req.cookies?.token;

    if (authHeader) {
        return String(authHeader).replace(/^Bearer\s+/i, "").trim();
    }

    if (cookieToken) {
        return String(cookieToken).replace(/^Bearer\s+/i, "").trim();
    }

    return null;
};

const issueAuthToken = (res, user, emailId) => {
    const token = jwt.sign(
        { _id: user._id, emailId, role: user.role },
        process.env.JWT_KEY,
        { expiresIn: 60 * 60 }
    );

    res.cookie('token', token, { maxAge: 60 * 60 * 1000 });

    return token;
};

const createRegisterHandler = (role = 'user') => async (req, res) => {
    try {
        validate(req.body);

        const { firstName, lastName, emailId, age, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            emailId,
            age,
            password: hashedPassword,
            role,
        });

        const token = issueAuthToken(res, user, emailId);
        const reply = {
          firstName: user.firstName,
          emailId: user.emailId,
          _id: user._id,
          role: user.role,
        };

        res.status(201).json({
          message: "Registered successfully",
          token,
          role: user.role,
          user: reply,
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const register = createRegisterHandler('user');
const registerAdmin = createRegisterHandler('admin');

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            throw new Error("Invalid Credentials");
        }

        const user = await User.findOne({ emailId });

        if (!user) {
            throw new Error("Invalid Credentials");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw new Error("Invalid Credentials");
        }

        const reply = {
          firstName: user.firstName,
          emailId: user.emailId,
          _id: user._id,
          role: user.role,
        };

        const token = issueAuthToken(res, user, emailId);

        res.status(200).json({
          message: "Logged in Successfully",
          token,
          role: user.role,
          user: reply,
        });
    } catch (err) {
        res.status(401).send("Error: " + err.message);
    }
};

const logout = async (req, res) => {
    try {
        const token = getTokenFromRequest(req);

        if (token && redisClient?.isReady) {
            const payload = jwt.decode(token);
            const ttlInSeconds = payload?.exp
                ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 1)
                : 60 * 60;

            await redisClient.setEx(`token:${token}`, ttlInSeconds, 'blocked');
        }

        res.cookie('token', '', { maxAge: 0 });
        res.status(201).json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getProfile = async (req, res) => {
    try {
        res.status(200).send("Profile fetched");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.user?._id || req.result?._id;

        if (!userId) {
            throw new Error("User not found in request");
        }

        await User.findByIdAndDelete(userId);
        await Submission.deleteMany({ userId });
        res.status(200).send("Profile deleted successfully");
    } catch (err) {
        res.status(500).send("Internal Server Error");

    }
};

module.exports = {
    register,
    registerAdmin,
    login,
    logout,
    deleteProfile,
};
