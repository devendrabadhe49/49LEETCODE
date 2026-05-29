const Problem = require("../models/Problem");
const Submission = require("../models/submission");
const { getLanguageById, submitBatch, submitToken } = require("../utill/problemUtillity");

const getSubmittedCode = (body = {}) => {
    const rawCode =
        body.code ??
        body.sourceCode ??
        body.source_code ??
        body.completeCode;

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

const submitCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.id;
        const code = getSubmittedCode(req.body);
        const language = normalizeLanguage(req.body?.language);

        if (!userId || !code || !problemId || !language) {
            return res.status(400).send("Some field missing");
        }

        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).send("Problem not found");
        }

        const languageId = getLanguageById(language);

        if (!languageId) {
            return res.status(400).send(`Unsupported language: ${language}`);
        }

        const hiddenTestCases = Array.isArray(problem.hiddenTestCases)
            ? problem.hiddenTestCases
            : [];

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status: "pending",
            testCasesTotal: hiddenTestCases.length,
        });

        const submissions = hiddenTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output,
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        // submittedResult ko update karo
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = "accepted";
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time || 0);
                memory = Math.max(memory, test.memory || 0);
            } else {
                status = test.status_id === 4 ? "wrong" : "error";
                errorMessage =
                    test.stderr ||
                    test.compile_output ||
                    test.message ||
                    test.status?.description ||
                    "Execution failed";
            }
        }

        // Store the result in Database in Submission
        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;

        await submittedResult.save();

        res.status(201).send(submittedResult);
    }
    catch (err) {
        res.status(500).send("Internal Server Error " + err.message);
    }
};

const runCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.id;

        const {code,language} = req.body;
        if (!userId || !code || !problemId || !language) 
            return res.status(400).send("Some field missing");
        
        const problem = await Problem.findById(problemId);
        

        //
        const languageId = getLanguageById(language);

        const submissions = problem.visibleTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output,
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);
        
        res.status(200).send(testResult);
    }
    catch (err) {
        res.status(500).send("Internal Server Error " + err.message);
    }
}

module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',
