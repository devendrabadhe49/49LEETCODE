const getLanguageById = (language) => {
    const languageMap = {
        "c++": 54,
        cpp: 54,
        java: 62,
        js: 63,
        javascript: 63,
        python: 71,
        python3: 71,
    };

    return languageMap[String(language).toLowerCase()];
};

const JUDGE0_TEXT_FIELDS = [
    "source_code",
    "stdin",
    "expected_output",
    "stdout",
    "stderr",
    "compile_output",
    "message",
];

const getJudgeBaseUrl = () => {
    return String(
        process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com"
    ).replace(/\/+$/, "");
};

const getJudgeHeaders = () => {
    const baseUrl = getJudgeBaseUrl();
    const apiKey = process.env.RAPIDAPI_KEY || process.env.JUDGE0_API_KEY || process.env.JUDGE0_KEY;
    const isRapidApi = baseUrl.includes("rapidapi.com");

    if (!isRapidApi) {
        return {
            "Content-Type": "application/json",
        };
    }

    if (!apiKey) {
        throw new Error("Judge0 API key is missing");
    }

    return {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": process.env.JUDGE0_HOST || new URL(baseUrl).host,
        "Content-Type": "application/json",
    };
};

const getReadableJudgeError = async (response) => {
    try {
        const rawBody = await response.text();

        if (!rawBody) {
            return "";
        }

        try {
            const parsedBody = JSON.parse(rawBody);
            const submissionErrors = Array.isArray(parsedBody?.submissions)
                ? parsedBody.submissions
                      .map((submissionError, index) => {
                          const message =
                              submissionError?.error ||
                              submissionError?.message ||
                              submissionError?.stderr;

                          return message ? `submission ${index + 1}: ${message}` : null;
                      })
                      .filter(Boolean)
                : [];

            return [
                parsedBody?.error,
                parsedBody?.message,
                parsedBody?.details,
                ...submissionErrors,
            ]
                .filter(Boolean)
                .join(" | ");
        } catch {
            return rawBody;
        }
    } catch {
        return "";
    }
};

const normalizeBatchSubmissions = (submissions) => {
    if (!Array.isArray(submissions) || submissions.length === 0) {
        throw new Error("Judge0 submissions must be a non-empty array");
    }

    return submissions.map((submission, index) => {
        if (!submission || typeof submission !== "object") {
            throw new Error(`Judge0 submission ${index + 1} is invalid`);
        }

        const sourceCode = String(submission.source_code || "");
        const languageId = Number(submission.language_id);

        if (!sourceCode.trim()) {
            throw new Error(`Judge0 submission ${index + 1} is missing source_code`);
        }

        if (!Number.isInteger(languageId)) {
            throw new Error(`Judge0 submission ${index + 1} has an invalid language_id`);
        }

        return {
            ...submission,
            source_code: sourceCode,
            language_id: languageId,
            stdin:
                submission.stdin === undefined || submission.stdin === null
                    ? ""
                    : String(submission.stdin),
            expected_output:
                submission.expected_output === undefined ||
                submission.expected_output === null
                    ? ""
                    : String(submission.expected_output),
        };
    });
};

const encodeBase64 = (value = "") => Buffer.from(String(value), "utf8").toString("base64");

const decodeBase64 = (value) => {
    if (typeof value !== "string" || value.length === 0) {
        return value;
    }

    try {
        return Buffer.from(value, "base64").toString("utf8");
    } catch {
        return value;
    }
};

const encodeJudgeSubmission = (submission) => ({
    ...submission,
    source_code: encodeBase64(submission.source_code),
    stdin: encodeBase64(submission.stdin),
    expected_output: encodeBase64(submission.expected_output),
});

const decodeJudgeSubmission = (submission = {}) => {
    if (!submission || typeof submission !== "object") {
        return submission;
    }

    const decodedSubmission = { ...submission };

    for (const field of JUDGE0_TEXT_FIELDS) {
        decodedSubmission[field] = decodeBase64(decodedSubmission[field]);
    }

    return decodedSubmission;
};

const submitBatch = async (submissions) => {
    const normalizedSubmissions = normalizeBatchSubmissions(submissions).map(encodeJudgeSubmission);
    const response = await fetch(
        `${getJudgeBaseUrl()}/submissions/batch?base64_encoded=true`,
        {
            method: "POST",
            headers: getJudgeHeaders(),
            body: JSON.stringify({ submissions: normalizedSubmissions }),
        }
    );

    if (!response.ok) {
        const details = await getReadableJudgeError(response);
        throw new Error(
            `Judge0 batch submission failed with status ${response.status}${
                details ? `: ${details}` : ""
            }`
        );
    }

    const result = await response.json();

    return Array.isArray(result) ? result : result.submissions || [];
};

const waiting = async (timer) => {
    await new Promise((resolve) => setTimeout(resolve, timer));
};

const submitToken = async (resultToken) => {
    if (!Array.isArray(resultToken) || resultToken.length === 0) {
        throw new Error("Judge0 token lookup requires at least one token");
    }

    while (true) {
        const response = await fetch(
            `${getJudgeBaseUrl()}/submissions/batch?tokens=${resultToken.join(",")}&base64_encoded=true&fields=*`,
            {
                method: "GET",
                headers: getJudgeHeaders(),
            }
        );

        if (!response.ok) {
            const details = await getReadableJudgeError(response);
            throw new Error(
                `Judge0 token lookup failed with status ${response.status}${
                    details ? `: ${details}` : ""
                }`
            );
        }

        const result = await response.json();
        const submissions = result.submissions || [];
        const isResultObtained = submissions.every((submission) => submission.status_id > 2);

        if (isResultObtained) {
            return submissions.map(decodeJudgeSubmission);
        }

        await waiting(1000);
    }
};

module.exports = {
    getLanguageById,
    submitBatch,
    submitToken,
};
