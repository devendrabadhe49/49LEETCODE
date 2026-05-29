const express = require("express");
const userMiddleware = require("../middleware/usermiddleware");
const { chatWithCoach } = require("../controllers/chatController");

const chatRouter = express.Router();

chatRouter.post("/ai/:id", userMiddleware, chatWithCoach);

module.exports = chatRouter;
