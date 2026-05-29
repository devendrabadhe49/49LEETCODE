const express = require('express');

const authRouter =  express.Router();
const { register, login, logout, registerAdmin, deleteProfile } = require('../controllers/userAuthent');
const userMiddleware = require("../middleware/usermiddleware");
const adminMiddleware = require('../middleware/adminmiddleware');

// Register
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware, registerAdmin);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.get('/check', userMiddleware, (req, res) => {

    const reply = {
        firstName: req.user.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role

    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
});
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile

// const express = require('express');

// const authRouter = express.Router();
// const {register,adminRegister,deleteProfile,login,logout,} = require('../controllers/userAuthent')
// const usermiddleware = require("../middleware/usermiddleware");
// const adminMiddleware = require('../middleware/adminMiddleware');

// const normalizeKey = (value) => {
//     if (Array.isArray(value)) {
//         return String(value[0] || '').trim();
//     }

//     return String(value || '').trim();
// };

// const adminSetupMiddleware = (req, res, next) => {
//     const setupKey = normalizeKey(process.env.ADMIN_SETUP_KEY);
//     const providedKey = normalizeKey(
//         req.headers['x-admin-setup-key'] ||
//         req.body?.adminSetupKey ||
//         req.query?.adminSetupKey
//     );

//     if (!setupKey) {
//         return res.status(500).send("Error: ADMIN_SETUP_KEY is not configured");
//     }

//     if (!providedKey) {
//         return res.status(401).send("Error: Admin setup key is missing");
//     }

//     if (providedKey !== setupKey) {
//         return res.status(401).send("Error: Invalid admin setup key");
//     }

//     next();
// };

// authRouter.post('/register', register);
// authRouter.post('/admin/register', adminSetupMiddleware, registerAdmin);
// authRouter.post('/login', login);
// authRouter.post('/logout', usermiddleware, logout);

// // authRouter.post('/getProfile', getProfile);

// module.exports = authRouter;
