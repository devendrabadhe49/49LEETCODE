const normalizeLanguage = (language) => {
    const normalized = String(language || "").trim().toLowerCase();

    const aliases = {
        js: "javascript",
        node: "javascript",
        nodejs: "javascript",
        py: "python",
        python3: "python",
        cplusplus: "c++",
        cpp: "c++",
    };

    return aliases[normalized] || normalized;
};

const compactText = (value, maxLength = 220) => {
    const collapsed = String(value || "").replace(/\s+/g, " ").trim();

    if (!collapsed) {
        return "";
    }

    if (collapsed.length <= maxLength) {
        return collapsed;
    }

    return `${collapsed.slice(0, maxLength - 3)}...`;
};

const formatList = (items) => {
    const filteredItems = items.filter(Boolean);

    if (filteredItems.length === 0) {
        return "";
    }

    return filteredItems.map((item) => `- ${item}`).join("\n");
};

const countMatches = (input, expression) => {
    const matches = input.match(expression);
    return matches ? matches.length : 0;
};

const pickLanguageCode = (collection = [], language) => {
    const normalizedLanguage = normalizeLanguage(language);

    const match = collection.find(
        (item) => normalizeLanguage(item?.language) === normalizedLanguage
    );

    if (match?.completeCode) {
        return match.completeCode;
    }

    if (match?.initialCode) {
        return match.initialCode;
    }

    const fallback = collection[0];
    return fallback?.completeCode || fallback?.initialCode || "";
};

const detectSignals = (code, language) => {
    const source = String(code || "");
    const normalizedLanguage = normalizeLanguage(language);

    if (!source.trim()) {
        return {
            isEmpty: true,
            hasReturn: false,
            usesHashMap: false,
            usesSort: false,
            usesRecursion: false,
            usesDP: false,
            usesQueue: false,
            usesStack: false,
            usesBinarySearch: false,
            nestedLoops: false,
            usesTwoPointers: false,
            riskySort: false,
            offByOneRisk: false,
        };
    }

    const hasReturn = /\breturn\b/.test(source);
    const usesHashMap =
        /\bMap\b|\bSet\b|\bunordered_map\b|\bHashMap\b|\bdict\b|\bCounter\b|\bObject\.create\(null\)/.test(
            source
        );
    const usesSort = /\.sort\(|\bsorted\(|\bArrays\.sort\(|\bsort\(/.test(source);
    const usesRecursion = /\b(dfs|helper|solve|backtrack|recurse)\s*\(/i.test(source);
    const usesDP = /\bdp\b|\bmemo\b|\bcache\b|\btabulation\b/i.test(source);
    const usesQueue = /\bqueue\b|\bdeque\b|\bQueue\b|\bpopleft\b/i.test(source);
    const usesStack = /\bstack\b|\bStack\b|append\(|push\(/.test(source);
    const usesBinarySearch =
        /\bmid\b|\bleft\s*<=\s*right\b|\blow\s*<=\s*high\b|\bbinary/i.test(source);
    const nestedLoops =
        countMatches(source, /\bfor\b|\bwhile\b/g) >= 2 ||
        (/\.map\(/.test(source) && /\.filter\(/.test(source));
    const usesTwoPointers =
        /\bleft\b/.test(source) &&
        /\bright\b/.test(source) &&
        (/while\s*\(/.test(source) || /\bfor\b/.test(source));
    const riskySort =
        normalizedLanguage === "javascript" &&
        /\.sort\(\s*\)/.test(source);
    const offByOneRisk = /<=\s*[\w.]+\.length\b|<=\s*n\b/.test(source);

    return {
        isEmpty: false,
        hasReturn,
        usesHashMap,
        usesSort,
        usesRecursion,
        usesDP,
        usesQueue,
        usesStack,
        usesBinarySearch,
        nestedLoops,
        usesTwoPointers,
        riskySort,
        offByOneRisk,
    };
};

const deriveStrategies = (problem, referenceSignals) => {
    const title = String(problem?.title || "").toLowerCase();
    const description = String(problem?.description || "").toLowerCase();
    const tag = String(problem?.tags || "").toLowerCase();
    const strategies = [];

    if (referenceSignals.usesDP || tag === "dynamic programming" || tag === "dp") {
        strategies.push("define a state clearly, write the transition, and lock the base cases first");
    }

    if (referenceSignals.usesHashMap || /anagram|frequency|duplicate|count/.test(description)) {
        strategies.push("a hash map or frequency table will likely simplify lookup-heavy logic");
    }

    if (referenceSignals.usesSort || tag === "sorting") {
        strategies.push("sorting first can reveal the structure, then a linear scan usually finishes the job");
    }

    if (referenceSignals.usesTwoPointers || /palindrome|pair|sorted array|two sum|substring/.test(description)) {
        strategies.push("two pointers or a sliding window is a strong direction if you can maintain an invariant");
    }

    if (referenceSignals.usesBinarySearch || tag === "searching") {
        strategies.push("binary search is worth checking if the answer space or input order is monotonic");
    }

    if (referenceSignals.usesRecursion || tag === "tree" || tag === "backtracking") {
        strategies.push("recursion fits naturally if each call can solve a smaller independent subproblem");
    }

    if (referenceSignals.usesQueue || tag === "graph") {
        strategies.push("BFS or DFS with a visited structure is usually the cleanest graph-style approach");
    }

    if (tag === "array") {
        strategies.push("look for a one-pass invariant before committing to nested loops");
    }

    if (tag === "string") {
        strategies.push("track indices and character counts instead of rebuilding strings repeatedly");
    }

    if (tag === "greedy") {
        strategies.push("focus on the local choice and the invariant that keeps it globally safe");
    }

    if (tag === "math") {
        strategies.push("search for a formula or pattern first so you do not simulate more than needed");
    }

    if (/grid|matrix/.test(description)) {
        strategies.push("treat row and column bounds carefully and test every boundary move");
    }

    if (/tree|bst|binary tree/.test(description) || /tree/.test(title)) {
        strategies.push("decide what each recursive call should return to its parent");
    }

    return [...new Set(strategies)].slice(0, 3);
};

const buildEdgeCases = (problem) => {
    const tag = String(problem?.tags || "").toLowerCase();
    const description = String(problem?.description || "").toLowerCase();
    const visibleTestCases = Array.isArray(problem?.visibleTestCases)
        ? problem.visibleTestCases
        : [];

    const edgeCases = [
        "empty input or the smallest allowed input size",
        "single element / single character input",
    ];

    if (tag === "array" || /array|sum|duplicate|sorted/.test(description)) {
        edgeCases.push("duplicate values, all equal values, and already sorted input");
        edgeCases.push("negative numbers or zero if the statement allows them");
    }

    if (tag === "string" || /string|substring|palindrome|anagram/.test(description)) {
        edgeCases.push("all characters same, mixed case rules, and repeated characters");
    }

    if (tag === "graph") {
        edgeCases.push("disconnected nodes, cycles, and isolated starting points");
    }

    if (tag === "tree") {
        edgeCases.push("null root, single node, and highly skewed trees");
    }

    if (tag === "dynamic programming" || tag === "dp") {
        edgeCases.push("the exact base case where your recurrence starts");
    }

    if (visibleTestCases[0]?.input) {
        edgeCases.push(`sample check: ${compactText(visibleTestCases[0].input, 90)}`);
    }

    return [...new Set(edgeCases)].slice(0, 4);
};

const buildComplexityHint = (referenceSignals, userSignals) => {
    if (referenceSignals.usesDP) {
        return "The likely target is not brute force. Try to collapse repeated work into memoized states or a table.";
    }

    if (referenceSignals.usesSort) {
        return "A realistic target is O(n log n): sorting does the heavy lifting, then a single scan often finishes the job.";
    }

    if (referenceSignals.usesHashMap || referenceSignals.usesTwoPointers) {
        return "This looks like it wants roughly linear work after setup, so nested loops are probably more expensive than necessary.";
    }

    if (referenceSignals.usesBinarySearch) {
        return "Watch for a monotonic condition. If it exists, you can often cut the search space with binary search.";
    }

    if (userSignals.nestedLoops) {
        return "Your current shape looks quadratic. That may still pass on small inputs, but it is worth checking whether a one-pass or sorted approach exists.";
    }

    return "Estimate complexity after choosing the core data structure. The right structure usually reveals the target time bound.";
};

const buildDebugHints = ({ currentSignals, referenceSignals, language, currentCode }) => {
    const hints = [];
    const normalizedLanguage = normalizeLanguage(language);
    const source = String(currentCode || "");

    if (currentSignals.isEmpty) {
        hints.push("Your editor still looks close to template state, so start by defining the exact state you want to maintain at each step.");
    }

    if (!currentSignals.hasReturn && !currentSignals.isEmpty) {
        hints.push("I do not see a clear `return`, so double-check that your function returns the final answer instead of only printing it.");
    }

    if (currentSignals.riskySort) {
        hints.push("In JavaScript, `.sort()` without a comparator sorts lexicographically. Use `.sort((a, b) => a - b)` for numbers.");
    }

    if (currentSignals.offByOneRisk) {
        hints.push("There may be an off-by-one risk around `<= length`. Re-check whether the last valid index should be `< length` instead.");
    }

    if (currentSignals.nestedLoops && (referenceSignals.usesHashMap || referenceSignals.usesTwoPointers)) {
        hints.push("Your current code appears more brute-force than the likely intended path. A hash map or pointer-based invariant could remove the inner loop.");
    }

    if (referenceSignals.usesDP && !currentSignals.usesDP) {
        hints.push("The tricky part is probably state definition. Write down: what does the answer mean after processing index `i`?");
    }

    if (referenceSignals.usesRecursion && !currentSignals.usesRecursion) {
        hints.push("A recursive helper may express the problem more cleanly than pushing all logic into one loop.");
    }

    if (referenceSignals.usesHashMap && !currentSignals.usesHashMap) {
        hints.push("You may be recomputing information that should be stored once in a map or set.");
    }

    if (normalizedLanguage === "javascript" && /\.push\(/.test(source) && /\.shift\(/.test(source)) {
        hints.push("If you are using an array as a queue with `.shift()`, keep an eye on performance for large inputs.");
    }

    return hints.slice(0, 4);
};

const classifyIntent = (message) => {
    const normalizedMessage = String(message || "").toLowerCase();

    if (/debug|bug|wrong|error|failing|fails|not work|issue|incorrect|fix/.test(normalizedMessage)) {
        return "debug";
    }

    if (/edge|corner|test case|cases/.test(normalizedMessage)) {
        return "edge";
    }

    if (/complex|time|space|optimi/.test(normalizedMessage)) {
        return "complexity";
    }

    if (/explain|understand|what.*asking|dry run|walkthrough/.test(normalizedMessage)) {
        return "explain";
    }

    return "hint";
};

const getFollowUpContext = (history, latestMessage) => {
    if (!Array.isArray(history) || history.length === 0) {
        return "";
    }

    const previousUserMessage = [...history]
        .reverse()
        .find(
            (item) =>
                item?.role === "user" &&
                typeof item?.content === "string" &&
                item.content.trim() &&
                item.content.trim() !== latestMessage.trim()
        );

    return previousUserMessage?.content ? compactText(previousUserMessage.content, 120) : "";
};

const buildExplanation = ({ problem, strategies, visibleTestCases }) => {
    const intro = compactText(problem?.description, 260);
    const sample = visibleTestCases[0];

    const lines = [
        intro && `The core ask is: ${intro}`,
        strategies[0] && `A strong lens for this problem is to ${strategies[0]}.`,
        sample?.input &&
            sample?.output &&
            `Checkpoint yourself on sample 1: input ${compactText(sample.input, 60)} should produce ${compactText(sample.output, 60)}.`,
    ];

    return lines.filter(Boolean).join("\n\n");
};

const buildHintReply = ({
    problem,
    strategies,
    debugHints,
    edgeCases,
    followUpContext,
}) => {
    const sections = [];

    sections.push(
        `For "${problem.title}", the best next move is to focus on the problem structure before writing more code.\n\n${formatList(
            strategies.map((strategy) => `Strategy: ${strategy}`)
        )}`
    );

    if (debugHints.length > 0) {
        sections.push(`Things I would check in your current attempt:\n${formatList(debugHints)}`);
    }

    sections.push(`Useful edge cases to test:\n${formatList(edgeCases)}`);

    if (followUpContext) {
        sections.push(`I am also keeping your earlier question in mind: "${followUpContext}".`);
    }

    sections.push("If you want, ask me for a dry run on sample 1 or for a language-specific implementation plan.");

    return sections.filter(Boolean).join("\n\n");
};

const buildDebugReply = ({ problem, debugHints, strategies, edgeCases }) => {
    const sections = [];

    sections.push(`I would debug "${problem.title}" in this order:\n${formatList(debugHints.length > 0 ? debugHints : [
        "verify the function is returning the expected value",
        "check your loop bounds and pointer updates",
        "compare your state after each sample testcase step",
    ])}`);

    if (strategies.length > 0) {
        sections.push(`If the logic still feels messy, simplify around this idea:\n${formatList([
            strategies[0],
            strategies[1],
        ])}`);
    }

    sections.push(`Fast testcase list:\n${formatList(edgeCases)}`);
    sections.push("If you paste the exact failing testcase or wrong output, I can narrow it down more precisely.");

    return sections.join("\n\n");
};

const buildEdgeReply = ({ problem, edgeCases }) => {
    return [
        `For "${problem.title}", these are the first edge cases I would run:`,
        formatList(edgeCases),
        "After that, compare whether your code preserves the intended invariant on each one.",
    ]
        .filter(Boolean)
        .join("\n\n");
};

const buildComplexityReply = ({ strategies, complexityHint, currentSignals, referenceSignals }) => {
    const notes = [];

    notes.push(complexityHint);

    if (currentSignals.nestedLoops && (referenceSignals.usesHashMap || referenceSignals.usesTwoPointers)) {
        notes.push("Your current shape looks more expensive than the likely intended solution, so try replacing repeated scans with stored state.");
    }

    if (strategies[0]) {
        notes.push(`The strategy that most affects complexity here is: ${strategies[0]}.`);
    }

    notes.push("If you want, I can estimate the time and space complexity of your current code specifically.");

    return notes.join("\n\n");
};

const buildCoachReply = ({ problem, message, currentCode, language, history }) => {
    const visibleTestCases = Array.isArray(problem?.visibleTestCases)
        ? problem.visibleTestCases
        : [];
    const referenceCode = pickLanguageCode(problem?.referenceSolution, language);
    const starterCode = pickLanguageCode(problem?.startCode, language);
    const currentSignals = detectSignals(currentCode, language);
    const referenceSignals = detectSignals(referenceCode, language);
    const strategies = deriveStrategies(problem, referenceSignals);
    const edgeCases = buildEdgeCases(problem);
    const debugHints = buildDebugHints({
        currentSignals,
        referenceSignals,
        language,
        currentCode,
    });
    const followUpContext = getFollowUpContext(history, message);
    const intent = classifyIntent(message);

    if (
        starterCode &&
        String(currentCode || "").trim() &&
        String(currentCode || "").trim() === String(starterCode).trim()
    ) {
        debugHints.unshift(
            "Your current code still matches the starter template closely, so first write the data structure or invariant you want to maintain."
        );
    }

    if (intent === "debug") {
        return buildDebugReply({ problem, debugHints, strategies, edgeCases });
    }

    if (intent === "edge") {
        return buildEdgeReply({ problem, edgeCases });
    }

    if (intent === "complexity") {
        return buildComplexityReply({
            strategies,
            complexityHint: buildComplexityHint(referenceSignals, currentSignals),
            currentSignals,
            referenceSignals,
        });
    }

    if (intent === "explain") {
        return buildExplanation({ problem, strategies, visibleTestCases });
    }

    return buildHintReply({
        problem,
        strategies,
        debugHints,
        edgeCases,
        followUpContext,
    });
};

module.exports = {
    buildCoachReply,
};
