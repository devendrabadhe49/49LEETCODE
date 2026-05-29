const Problem = require("../models/Problem");
const { buildCoachReply } = require("../utill/chatCoach");

const chatWithCoach = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, currentCode = "", language = "", history = [] } = req.body || {};

        if (!id) {
            return res.status(400).send("Problem ID is Missing");
        }

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).send("Message is required");
        }

        const problem = await Problem.findById(id).select(
            "_id title description difficulty tags visibleTestCases startCode referenceSolution"
        );

        if (!problem) {
            return res.status(404).send("Problem is Missing");
        }

        const reply = buildCoachReply({
            problem,
            message,
            currentCode,
            language,
            history,
        });

        return res.status(200).json({
            message: reply,
        });
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }
};

module.exports = {
    chatWithCoach,
};
