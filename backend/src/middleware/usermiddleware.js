const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

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

const isTokenBlocked = async (token) => {
    if (!redisClient?.isReady) {
        return false;
    }

    try {
        return Boolean(await redisClient.exists(`token:${token}`));
    } catch (err) {
        console.error("Redis blocklist check failed:", err.message);
        return false;
    }
};

const userMiddleware = async (req,res,next)=>{

    try{

        const token = getTokenFromRequest(req);
        if(!token)
            throw new Error("Token is not present");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await isTokenBlocked(token);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.user = result;
        req.result = result;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = userMiddleware;
