const {getLanguageById,submitBatch,submitToken} = require("../utill/problemUtillity");
const Problem = require("../models/Problem");
const Submission = require("../models/submission");


const getReferenceCode = (solution = {}) => {
    const rawCode =
        solution.completeCode ??
        solution.code ??
        solution.sourceCode ??
        solution.source_code;

    return typeof rawCode === "string" ? rawCode.trim() : "";
};

const normalizeLanguage = (language) => {
    const normalized = String(language || "").trim().toLowerCase();

    const languageAliases = {
        cpp: "c++",
        cplusplus: "c++",
        js: "javascript",
        py: "python",
        python3: "python",
    };

    return languageAliases[normalized] || normalized;
};

const getJudgeErrorMessage = (test) => {
    const details = [
        test.status?.description,
        test.stderr,
        test.compile_output,
        test.message,
        test.stdin ? `input: ${JSON.stringify(test.stdin)}` : null,
        test.expected_output
            ? `expected: ${JSON.stringify(test.expected_output)}`
            : null,
        test.stdout !== undefined && test.stdout !== null
            ? `stdout: ${JSON.stringify(test.stdout)}`
            : null,
    ].filter(Boolean);

    return details.join(" | ") || `Judge0 validation failed with status ${test.status_id}`;
};

const validateReferenceSolution = async (visibleTestCases, referenceSolution) => {
    if (!Array.isArray(visibleTestCases) || visibleTestCases.length === 0) {
        throw new Error("visibleTestCases must be a non-empty array");
    }

    if (!Array.isArray(referenceSolution) || referenceSolution.length === 0) {
        throw new Error("referenceSolution must be a non-empty array");
    }

    for (const solution of referenceSolution) {
        const language = normalizeLanguage(solution?.language);
        const completeCode = getReferenceCode(solution);
        const languageId = getLanguageById(language);

        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }

        if (!completeCode) {
            throw new Error(`Reference solution code is missing for ${language}`);
        }

        const submissions = visibleTestCases.map((testCase) => ({
            source_code: completeCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output,
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        for (const [index, test] of testResult.entries()) {
            if (test.status_id !== 3) {
                throw new Error(
                    `Reference solution failed for ${language} on visible test case ${
                        index + 1
                    }: ${getJudgeErrorMessage(test)}`
                );
            }
        }
    }
};

const createProblem = async (req, res) => {
    const {
        visibleTestCases,
        referenceSolution,
    } = req.body;

    try {
        await validateReferenceSolution(visibleTestCases, referenceSolution);

        await Problem.create({
            ...req.body,
            problemCreater: req.result._id,
        });

        res.status(201).send("Problem Saved Succesfully");
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const {
        visibleTestCases,
        referenceSolution,
    } = req.body;

    try {
        if (!id) {
            return res.status(400).send("Missing ID Field");
        }

        const DsaProblem = await Problem.findById(id);

        if (!DsaProblem) {
            return res.status(404).send("ID is not persent in server");
        }

        await validateReferenceSolution(visibleTestCases, referenceSolution);

        await Problem.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });

        res.status(200).send("Problem Updated Succesfully");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).send("ID is Missing");
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if (!deletedProblem) {
            return res.status(404).send("Problem is Missing");
        }

        res.status(200).send("Successfully Deleted");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getProblemById = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).send("ID is Missing");
        }

        const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases hiddenTestCases startCode referenceSolution ');

        if (!getProblem) {
            return res.status(404).send("Problem is Missing");
        }

        res.status(200).send(getProblem);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getAllProblem = async (req, res) => {
    try {
        const getProblem = await Problem.find({}).select('_id title difficulty tags');

        if (getProblem.length === 0) {
            return res.status(404).send("Problem is Missing");
        }

        res.status(200).send(getProblem);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const solveAllProblembyUser = async (req, res) => {
    try {
        const userId = req.result._id;

        const solvedProblemIds = await Submission.distinct("problemId", {
            userId,
            status: "accepted",
        });

        if (solvedProblemIds.length === 0) {
            return res.status(200).send([]);
        }

        const solvedProblems = await Problem.find({
            _id: { $in: solvedProblemIds },
        }).select("_id title difficulty tags");

        res.status(200).send(solvedProblems);
    }
    catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const submittedProblem = async (req, res) =>{

    try {
        const  userId  = req.result._id;
        const problemId = req.params.id;

        const ans = await Submission.find({ userId, problemId });

        if (ans.length === 0) {
            return res.status(200).send([]);
        }

        res.status(200).send(ans);
    }

    catch (err){
        res.status(500).send("Internal Server Error");
    }
}
module.exports = {
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemById,
    getAllProblem,
    solveAllProblembyUser,
    submittedProblem,
};
