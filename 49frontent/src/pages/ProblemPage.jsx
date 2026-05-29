import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Code2,
  GripVertical,
  Loader2,
  Moon,
  Play,
  SendHorizontal,
  Sparkles,
  Sun,
  TerminalSquare,
} from "lucide-react";
import axiosClient from "../utill/axiosClient";
import AIChat from "../components/AIChat";
import SubmissionHistory from "../components/SubmissionHistory";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript", editorLanguage: "javascript" },
  { value: "python", label: "Python", editorLanguage: "python" },
  { value: "c++", label: "C++", editorLanguage: "cpp" },
  { value: "java", label: "Java", editorLanguage: "java" },
];

const DEFAULT_CODE = {
  javascript: "// Write your solution here",
  python: "# Write your solution here",
  "c++": "// Write your solution here",
  java: "// Write your solution here",
};

const DEFAULT_PANEL_WIDTH = 52;
const MIN_PANEL_WIDTH = 36;
const MAX_PANEL_WIDTH = 66;
const CONSOLE_TABS = [
  { id: "testcase", label: "Testcase" },
  { id: "output", label: "Output" },
  { id: "result", label: "Result" },
];
const PROBLEM_TABS = [
  { id: "description", label: "Description" },
  { id: "editorial", label: "Editorial" },
  { id: "solutions", label: "Solutions" },
  { id: "submissions", label: "Submissions" },
  { id: "ai", label: "AI" },
];

const normalizeLanguage = (language) => {
  switch (String(language || "").trim().toLowerCase()) {
    case "cpp":
    case "cplusplus":
    case "c++":
      return "c++";
    case "js":
    case "javascript":
      return "javascript";
    case "python":
    case "python3":
      return "python";
    case "java":
      return "java";
    default:
      return "javascript";
  }
};

const clampPanelWidth = (width) =>
  Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));

const getInitialDarkMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedTheme = window.localStorage.getItem("problem-page-theme");

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme === "dark";
    }
  } catch (error) {
    console.warn("Unable to read saved theme:", error);
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
};

const getTheme = (isDarkMode) =>
  isDarkMode
    ? {
        page:
          "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100",
        panel: "border-slate-700/80 bg-slate-900/95 shadow-black/40",
        hero:
          "border-slate-700/80 bg-gradient-to-br from-slate-900 via-sky-950/50 to-slate-950",
        surface: "border-slate-700 bg-slate-950/50",
        card: "border-slate-700 bg-slate-900/80",
        code: "border-slate-700 bg-slate-950/70 text-slate-200",
        text: "text-slate-100",
        strong: "text-white",
        muted: "text-slate-400",
        faint: "text-slate-500",
        ghost:
          "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white",
        softButton:
          "border-sky-400/30 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20 hover:shadow-sky-500/20",
        submit:
          "from-sky-400 via-cyan-300 to-emerald-300 text-slate-950 shadow-sky-500/20",
      }
    : {
        page:
          "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-950",
        panel: "border-slate-200/80 bg-white/90 shadow-slate-900/30",
        hero:
          "border-slate-200/80 bg-gradient-to-br from-white via-sky-50/80 to-slate-50",
        surface: "border-slate-200 bg-slate-50/80",
        card: "border-slate-200 bg-white",
        code: "border-slate-200 bg-white text-slate-700",
        text: "text-slate-700",
        strong: "text-slate-950",
        muted: "text-slate-500",
        faint: "text-slate-400",
        ghost:
          "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-950",
        softButton:
          "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:shadow-sky-500/20",
        submit:
          "from-slate-950 via-slate-800 to-sky-700 text-white shadow-slate-950/20",
      };

const getTone = (tone, isDarkMode) => {
  const colors = {
    success: isDarkMode
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: isDarkMode
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : "border-amber-200 bg-amber-50 text-amber-700",
    danger: isDarkMode
      ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
      : "border-rose-200 bg-rose-50 text-rose-700",
    info: isDarkMode
      ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
      : "border-sky-200 bg-sky-50 text-sky-700",
    neutral: isDarkMode
      ? "border-slate-700 bg-slate-800 text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-600",
  };

  return colors[tone] || colors.neutral;
};

const getDifficultyBadgeColor = (difficulty, isDarkMode) => {
  switch (String(difficulty || "").toLowerCase()) {
    case "easy":
      return getTone("success", isDarkMode);
    case "medium":
      return getTone("warning", isDarkMode);
    case "hard":
      return getTone("danger", isDarkMode);
    default:
      return getTone("neutral", isDarkMode);
  }
};

const getJudgeStatusTone = (statusId, isDarkMode) => {
  switch (statusId) {
    case 3:
      return getTone("success", isDarkMode);
    case 4:
      return getTone("danger", isDarkMode);
    default:
      return getTone("warning", isDarkMode);
  }
};

const getSubmissionStatusTone = (status, isDarkMode) => {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
      return getTone("success", isDarkMode);
    case "wrong":
      return getTone("danger", isDarkMode);
    case "error":
      return getTone("warning", isDarkMode);
    case "pending":
      return getTone("info", isDarkMode);
    default:
      return getTone("neutral", isDarkMode);
  }
};

const getProblemTags = (tags) => {
  const tagList = Array.isArray(tags) ? tags : String(tags || "").split(/[,|]/);

  return tagList
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
};

const getErrorMessage = (error, fallbackMessage) => {
  const responseMessage = error?.response?.data;

  if (!responseMessage) {
    return fallbackMessage;
  }

  if (typeof responseMessage === "string") {
    return responseMessage;
  }

  return responseMessage.message || JSON.stringify(responseMessage);
};

const formatMemory = (memory) => {
  if (!memory) {
    return "0 kB";
  }

  if (memory < 1024) {
    return `${memory} kB`;
  }

  return `${(memory / 1024).toFixed(2)} MB`;
};

const formatRuntime = (time) => {
  if (time === null || time === undefined || time === "") {
    return "0s";
  }

  return `${time}s`;
};

const getConsoleOutput = (result) =>
  result?.stdout ||
  result?.stderr ||
  result?.compile_output ||
  result?.message ||
  result?.errorMessage ||
  "No output";

const buildInitialCodeMap = (startCode = []) => {
  const nextCodeMap = { ...DEFAULT_CODE };

  startCode.forEach((template) => {
    const language = normalizeLanguage(template?.language);
    const initialCode = String(template?.initialCode || "");

    if (initialCode.trim()) {
      nextCodeMap[language] = initialCode;
    }
  });

  return nextCodeMap;
};

function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${className}`}
    >
      {children}
    </span>
  );
}

function StatTile({ label, value, helper, theme }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.faint}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${theme.strong}`}>{value}</p>
      {helper && <p className={`mt-1 text-sm ${theme.muted}`}>{helper}</p>}
    </div>
  );
}

function ResultCodeBlock({ label, value, theme }) {
  return (
    <div>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.22em] ${theme.faint}`}>
        {label}
      </p>
      <pre
        className={`min-h-24 overflow-x-auto whitespace-pre-wrap rounded-2xl border p-4 font-mono text-sm leading-6 transition-colors duration-300 ${theme.code}`}
      >
        {value || "-"}
      </pre>
    </div>
  );
}

function ProblemPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [codeByLanguage, setCodeByLanguage] = useState({ ...DEFAULT_CODE });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");
  const [activeTab, setActiveTab] = useState("description");
  const layoutRef = useRef(null);
  const theme = getTheme(isDarkMode);
  const pageTheme = isDarkMode ? "dark" : "light";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchProblem = async () => {
      try {
        const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
        setProblem(data);
        setCodeByLanguage(buildInitialCodeMap(data.startCode));
      } catch (error) {
        console.error("Error fetching problem:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, isAuthenticated, navigate]);

  useEffect(() => {
    try {
      window.localStorage.setItem("problem-page-theme", pageTheme);
    } catch (error) {
      console.warn("Unable to save theme:", error);
    }
  }, [pageTheme]);

  useEffect(
    () => () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    []
  );

  const currentCode = codeByLanguage[language] || DEFAULT_CODE[language];
  const selectedLanguage = LANGUAGE_OPTIONS.find((option) => option.value === language);
  const visibleTestCases = Array.isArray(problem?.visibleTestCases)
    ? problem.visibleTestCases
    : [];
  const referenceSolutions = Array.isArray(problem?.referenceSolution)
    ? problem.referenceSolution
    : [];
  const editorialContent =
    problem?.editorial || problem?.editorialText || problem?.approach || "";
  const problemTags = getProblemTags(problem?.tags);
  const editorTheme = isDarkMode ? "vs-dark" : "light";

  const updateCurrentCode = (nextCode = "") => {
    setCodeByLanguage((currentMap) => ({
      ...currentMap,
      [language]: nextCode,
    }));
  };

  const handleResizeStart = (event) => {
    const layout = layoutRef.current;

    if (!layout) {
      return;
    }

    event.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const updatePanelWidth = (pointerEvent) => {
      const bounds = layout.getBoundingClientRect();
      const nextWidth = ((pointerEvent.clientX - bounds.left) / bounds.width) * 100;

      setLeftPanelWidth(clampPanelWidth(nextWidth));
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", updatePanelWidth);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    updatePanelWidth(event);
    window.addEventListener("pointermove", updatePanelWidth);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  const handleResizeKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setLeftPanelWidth((currentWidth) => clampPanelWidth(currentWidth - 2));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setLeftPanelWidth((currentWidth) => clampPanelWidth(currentWidth + 2));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setLeftPanelWidth(MIN_PANEL_WIDTH);
    }

    if (event.key === "End") {
      event.preventDefault();
      setLeftPanelWidth(MAX_PANEL_WIDTH);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setFeedback(null);
    setActiveConsoleTab("output");

    try {
      const { data } = await axiosClient.post(`/submit/run/${problemId}`, {
        code: currentCode,
        language,
      });

      setRunResult(data);
    } catch (error) {
      console.error("Error running code:", error);
      setRunResult({
        error: getErrorMessage(error, "Failed to run code"),
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setRunResult(null);
    setFeedback(null);
    setActiveConsoleTab("result");

    try {
      const { data } = await axiosClient.post(`/submit/submit/${problemId}`, {
        code: currentCode,
        language,
      });

      setRunResult(data);
      setHistoryRefreshKey((currentValue) => currentValue + 1);
      setFeedback({
        tone: "success",
        message: "Solution submitted. The result is shown below and history is refreshed.",
      });
    } catch (error) {
      console.error("Error submitting code:", error);
      const message = getErrorMessage(error, "Failed to submit code");

      setRunResult({
        error: message,
      });
      setFeedback({
        tone: "error",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getConsoleStatus = () => {
    if (running) {
      return {
        label: "Running",
        tone: "info",
        message: "Executing sample testcases against your current solution.",
      };
    }

    if (submitting) {
      return {
        label: "Submitting",
        tone: "info",
        message: "Sending solution to the judge and waiting for verdict.",
      };
    }

    if (!runResult) {
      return {
        label: "Ready",
        tone: "neutral",
        message: "Run code or submit to populate this console.",
      };
    }

    if (runResult.error || runResult.errorMessage) {
      return {
        label: "Error",
        tone: "danger",
        message: runResult.error || runResult.errorMessage,
      };
    }

    if (Array.isArray(runResult)) {
      const passedCount = runResult.filter((result) => result.status_id === 3).length;
      const allPassed = passedCount === runResult.length;

      return {
        label: allPassed ? "Success" : "Check Output",
        tone: allPassed ? "success" : "warning",
        message: `${passedCount}/${runResult.length} testcase${
          runResult.length === 1 ? "" : "s"
        } passed.`,
      };
    }

    const accepted = String(runResult.status || "").toLowerCase() === "accepted";

    return {
      label: accepted ? "Accepted" : runResult.status || "Submitted",
      tone: accepted ? "success" : "warning",
      message: `${runResult.testCasesPassed || 0}/${
        runResult.testCasesTotal || 0
      } testcases passed.`,
    };
  };

  const renderConsoleLoading = (message) => (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-sky-400/20 bg-slate-950 p-8 text-center text-slate-200 shadow-inner">
      <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
      <p className="mt-4 font-semibold">{message}</p>
      <p className="mt-2 text-sm text-slate-400">
        Judge is processing your latest {language} code.
      </p>
    </div>
  );

  const renderEmptyProblemTab = (title, message) => (
    <div
      className={`rounded-[1.75rem] border border-dashed p-8 text-center ${theme.surface}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-emerald-300/20 text-sky-400">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className={`mt-4 text-xl font-bold ${theme.strong}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-xl text-sm leading-6 ${theme.muted}`}>
        {message}
      </p>
    </div>
  );

  const renderDescriptionTab = () => (
    <div className="space-y-8">
      <section
        className={`rounded-[1.75rem] border p-5 transition-all duration-300 hover:shadow-xl sm:p-6 ${theme.surface}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
              Prompt
            </p>
            <h2 className={`mt-1 text-2xl font-bold ${theme.strong}`}>
              Problem Description
            </h2>
          </div>
        </div>
        <div className={`whitespace-pre-wrap text-base leading-8 ${theme.text}`}>
          {problem.description}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
              Samples
            </p>
            <h2 className={`mt-1 text-2xl font-bold ${theme.strong}`}>Examples</h2>
          </div>
          <Pill className={getTone("neutral", isDarkMode)}>
            {visibleTestCases.length} case
            {visibleTestCases.length === 1 ? "" : "s"}
          </Pill>
        </div>

        {visibleTestCases.length > 0 ? (
          <div className="grid gap-4">
            {visibleTestCases.map((testCase, index) => (
              <article
                key={index}
                className={`rounded-[1.75rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className={`text-lg font-bold ${theme.strong}`}>
                    Example {index + 1}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getTone(
                      "neutral",
                      isDarkMode
                    )}`}
                  >
                    Sample
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ResultCodeBlock label="Input" value={testCase.input} theme={theme} />
                  <ResultCodeBlock label="Output" value={testCase.output} theme={theme} />
                </div>

                {testCase.explanation && (
                  <div className={`mt-4 rounded-2xl border p-4 ${theme.surface}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.faint}`}>
                      Explanation
                    </p>
                    <p className={`mt-2 leading-7 ${theme.text}`}>
                      {testCase.explanation}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div
            className={`rounded-[1.75rem] border border-dashed p-8 text-center ${theme.surface} ${theme.muted}`}
          >
            No visible examples are available for this problem.
          </div>
        )}
      </section>
    </div>
  );

  const renderEditorialTab = () => {
    if (!editorialContent) {
      return renderEmptyProblemTab(
        "Editorial coming soon",
        "No editorial is attached to this problem yet. You can still use the AI tab for hints, edge cases, and approach guidance."
      );
    }

    return (
      <section
        className={`rounded-[1.75rem] border p-5 transition-all duration-300 sm:p-6 ${theme.surface}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
          Official Notes
        </p>
        <h2 className={`mt-1 text-2xl font-bold ${theme.strong}`}>Editorial</h2>
        <div className={`mt-5 whitespace-pre-wrap text-base leading-8 ${theme.text}`}>
          {editorialContent}
        </div>
      </section>
    );
  };

  const renderSolutionsTab = () => {
    if (referenceSolutions.length === 0) {
      return renderEmptyProblemTab(
        "No official solutions yet",
        "Reference solutions are not available for this problem response. Once the API returns them, they will appear here by language."
      );
    }

    return (
      <div className="space-y-4">
        {referenceSolutions.map((solution, index) => {
          const languageName = solution?.language || `Solution ${index + 1}`;
          const solutionCode =
            solution?.completeCode || solution?.code || solution?.solution || "";

          return (
            <article
              key={`${languageName}-${index}`}
              className={`rounded-[1.75rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
                    Reference
                  </p>
                  <h3 className={`mt-1 text-xl font-bold ${theme.strong}`}>
                    {languageName}
                  </h3>
                </div>
                <Pill className={getTone("info", isDarkMode)}>official</Pill>
              </div>
              <pre
                className={`max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border p-4 font-mono text-sm leading-7 ${theme.code}`}
              >
                {solutionCode || "No solution code found for this language."}
              </pre>
            </article>
          );
        })}
      </div>
    );
  };

  const renderSubmissionsTab = () => (
    <div className={`rounded-[1.75rem] border p-2 ${theme.surface}`}>
      <SubmissionHistory problemId={problemId} refreshKey={historyRefreshKey} />
    </div>
  );

  const renderAiTab = () => (
    <div className={`rounded-[1.75rem] border p-2 ${theme.surface}`}>
      <AIChat
        problem={problem}
        currentCode={currentCode}
        language={language}
      />
    </div>
  );

  const renderProblemTabs = () => (
    <div
      className={`sticky top-0 z-50 rounded-t-[2rem] border-b px-3 py-3 backdrop-blur-2xl sm:px-4 ${
        isDarkMode
          ? "border-slate-700/80 bg-slate-950/85 shadow-2xl shadow-black/25"
          : "border-white/80 bg-white/90 shadow-2xl shadow-slate-900/10"
      }`}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {PROBLEM_TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-sky-400 to-emerald-300 text-slate-950 shadow-lg shadow-sky-500/20"
                    : `${theme.muted} hover:-translate-y-0.5 hover:bg-slate-900/10 hover:text-sky-500`
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProblemTabContent = () => {
    const tabContent = {
      description: renderDescriptionTab,
      editorial: renderEditorialTab,
      solutions: renderSolutionsTab,
      submissions: renderSubmissionsTab,
      ai: renderAiTab,
    };
    const renderActiveTab = tabContent[activeTab] || renderDescriptionTab;

    return (
      <div key={activeTab} className="animate-tab-fade">
        {renderActiveTab()}
      </div>
    );
  };

  const renderTestcasePanel = () => {
    if (visibleTestCases.length === 0) {
      return (
        <div
          className={`rounded-3xl border border-dashed p-8 text-center ${theme.surface} ${theme.muted}`}
        >
          No visible testcases are available yet.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {visibleTestCases.map((testCase, index) => (
          <article key={index} className={`rounded-3xl border p-4 ${theme.card}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className={`font-bold ${theme.strong}`}>Case {index + 1}</h3>
              <Pill className={getTone("neutral", isDarkMode)}>sample</Pill>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ResultCodeBlock label="Input" value={testCase.input} theme={theme} />
              <ResultCodeBlock label="Expected" value={testCase.output} theme={theme} />
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderOutputPanel = () => {
    if (running) {
      return renderConsoleLoading("Running sample testcases");
    }

    if (submitting) {
      return renderConsoleLoading("Submitting to judge");
    }

    if (!runResult) {
      return (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-300 shadow-inner">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            console ready
          </div>
          <pre className="mt-4 whitespace-pre-wrap text-slate-400">
{`$ run your solution
Waiting for execution output...`}
          </pre>
        </div>
      );
    }

    if (runResult.error) {
      return (
        <div className="rounded-3xl border border-rose-500/30 bg-slate-950 p-5 font-mono text-sm leading-7 text-rose-200 shadow-inner">
          <div className="mb-4 flex items-center gap-2 text-rose-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            execution failed
          </div>
          <pre className="whitespace-pre-wrap">{runResult.error}</pre>
        </div>
      );
    }

    if (Array.isArray(runResult)) {
      return (
        <div className="space-y-4">
          {runResult.map((result, index) => {
            const passed = result.status_id === 3;

            return (
              <article
                key={result.token || index}
                className={`rounded-3xl border bg-slate-950 p-5 font-mono text-sm leading-7 shadow-inner ${
                  passed ? "border-emerald-500/25" : "border-rose-500/25"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div
                    className={`flex items-center gap-2 ${
                      passed ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        passed ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    testcase {index + 1}:{" "}
                    {result.status?.description || `status ${result.status_id}`}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatRuntime(result.time)} / {formatMemory(result.memory)}
                  </span>
                </div>

                <pre className="whitespace-pre-wrap text-slate-200">
                  {getConsoleOutput(result)}
                </pre>
              </article>
            );
          })}
        </div>
      );
    }

    const submissionOutput =
      runResult.errorMessage ||
      runResult.output ||
      runResult.stdout ||
      runResult.stderr ||
      `status: ${runResult.status || "submitted"}
runtime: ${formatRuntime(runResult.runtime)}
memory: ${formatMemory(runResult.memory)}
passed: ${runResult.testCasesPassed || 0}/${runResult.testCasesTotal || 0}`;

    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-200 shadow-inner">
        <div className="mb-4 flex items-center gap-2 text-sky-300">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          submission output
        </div>
        <pre className="whitespace-pre-wrap">{submissionOutput}</pre>
      </div>
    );
  };

  const renderBottomPanel = () => {
    const consoleStatus = getConsoleStatus();
    const tabContent = {
      testcase: renderTestcasePanel,
      output: renderOutputPanel,
      result: renderResultPanel,
    };
    const renderActiveTab = tabContent[activeConsoleTab] || renderTestcasePanel;

    return (
      <section
        className={`border-t p-4 transition-colors duration-300 sm:p-5 ${theme.card}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-2xl border border-slate-800 bg-slate-950 p-1 shadow-inner">
            {CONSOLE_TABS.map((tab) => {
              const isActive = activeConsoleTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveConsoleTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {(running || submitting) && (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            )}
            <Pill className={getTone(consoleStatus.tone, isDarkMode)}>
              {consoleStatus.label}
            </Pill>
          </div>
        </div>

        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${theme.surface}`}>
          <span className={theme.muted}>{consoleStatus.message}</span>
        </div>

        <div className="max-h-[34rem] overflow-y-auto">{renderActiveTab()}</div>
      </section>
    );
  };

  const renderResultPanel = () => {
    if (running) {
      return renderConsoleLoading("Running sample testcases");
    }

    if (submitting) {
      return renderConsoleLoading("Waiting for judge verdict");
    }

    if (!runResult) {
      return (
        <div
          className={`rounded-3xl border border-dashed p-8 text-center transition-colors duration-300 ${theme.surface}`}
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${theme.card} ${theme.muted}`}
          >
            <TerminalSquare className="h-6 w-6" />
          </div>
          <h3 className={`mt-4 text-lg font-semibold ${theme.strong}`}>
            Run your code to inspect output
          </h3>
          <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${theme.muted}`}>
            Test case output, runtime, memory usage, and submission feedback will appear
            here.
          </p>
        </div>
      );
    }

    if (runResult.error) {
      return (
        <div
          className={`rounded-3xl border p-5 text-sm leading-6 ${getTone(
            "danger",
            isDarkMode
          )}`}
        >
          <p className="font-semibold uppercase tracking-[0.22em]">Execution Error</p>
          <p className="mt-2">{runResult.error}</p>
        </div>
      );
    }

    if (Array.isArray(runResult)) {
      const passedCount = runResult.filter((result) => result.status_id === 3).length;
      const overallAccepted = passedCount === runResult.length;

      return (
        <div className="space-y-5">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-5 transition-all duration-300 ${theme.surface}`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.faint}`}>
                Run Result
              </p>
              <h3 className={`mt-1 text-xl font-bold ${theme.strong}`}>
                {overallAccepted ? "All sample tests passed" : "Review failed cases"}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill className={getTone(overallAccepted ? "success" : "warning", isDarkMode)}>
                {overallAccepted ? "Accepted" : "Needs Work"}
              </Pill>
              <Pill className={getTone("neutral", isDarkMode)}>
                {passedCount}/{runResult.length} passed
              </Pill>
            </div>
          </div>

          <div className="grid gap-4">
            {runResult.map((result, index) => {
              const outputText = getConsoleOutput(result);

              return (
                <article
                  key={result.token || index}
                  className={`rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h4 className={`text-base font-bold ${theme.strong}`}>
                      Test Case {index + 1}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getJudgeStatusTone(result.status_id, isDarkMode)}>
                        {result.status?.description || `Status ${result.status_id}`}
                      </Pill>
                      <Pill className={getTone("neutral", isDarkMode)}>
                        {formatRuntime(result.time)}
                      </Pill>
                      <Pill className={getTone("neutral", isDarkMode)}>
                        {formatMemory(result.memory)}
                      </Pill>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    <ResultCodeBlock label="Input" value={result.stdin} theme={theme} />
                    <ResultCodeBlock
                      label="Expected"
                      value={result.expected_output}
                      theme={theme}
                    />
                    <ResultCodeBlock label="Output" value={outputText} theme={theme} />
                  </div>
                </article>
              );
            })}
          </div>

          <details className={`group rounded-3xl border p-5 ${theme.surface}`}>
            <summary
              className={`cursor-pointer text-sm font-semibold transition hover:opacity-80 ${theme.text}`}
            >
              Raw response
            </summary>
            <pre
              className={`mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border p-4 font-mono text-xs leading-6 ${theme.code}`}
            >
              {JSON.stringify(runResult, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-5 ${theme.surface}`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.faint}`}>
              Submission Result
            </p>
            <h3 className={`mt-1 text-xl font-bold ${theme.strong}`}>
              Latest submission feedback
            </h3>
          </div>
          <Pill className={getSubmissionStatusTone(runResult.status, isDarkMode)}>
            {runResult.status || "Submitted"}
          </Pill>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Runtime" value={formatRuntime(runResult.runtime)} theme={theme} />
          <StatTile label="Memory" value={formatMemory(runResult.memory)} theme={theme} />
          <StatTile
            label="Passed"
            value={`${runResult.testCasesPassed || 0}/${runResult.testCasesTotal || 0}`}
            theme={theme}
          />
        </div>

        {runResult.errorMessage && (
          <div
            className={`rounded-3xl border p-5 text-sm leading-6 ${getTone(
              "danger",
              isDarkMode
            )}`}
          >
            {runResult.errorMessage}
          </div>
        )}

        <details className={`group rounded-3xl border p-5 ${theme.surface}`}>
          <summary
            className={`cursor-pointer text-sm font-semibold transition hover:opacity-80 ${theme.text}`}
          >
            Raw response
          </summary>
          <pre
            className={`mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border p-4 font-mono text-xs leading-6 ${theme.code}`}
          >
            {JSON.stringify(runResult, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        data-theme={pageTheme}
        className={`flex min-h-screen items-center justify-center px-4 transition-colors duration-500 ${theme.page}`}
      >
        <div
          className={`rounded-3xl border p-8 text-center shadow-2xl transition-colors duration-300 ${theme.card}`}
        >
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500" />
          <p className={`mt-5 text-sm font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
            Loading problem
          </p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div
        data-theme={pageTheme}
        className={`flex min-h-screen items-center justify-center px-4 transition-colors duration-500 ${theme.page}`}
      >
        <div
          className={`max-w-md rounded-3xl border p-8 text-center shadow-2xl transition-colors duration-300 ${theme.card}`}
        >
          <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${theme.faint}`}>
            404
          </p>
          <h2 className={`mt-3 text-3xl font-bold ${theme.strong}`}>Problem Not Found</h2>
          <p className={`mt-3 text-sm leading-6 ${theme.muted}`}>
            The problem may have been removed or the link is no longer valid.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      data-theme={pageTheme}
      className={`min-h-screen px-4 py-6 transition-colors duration-500 sm:px-6 lg:px-8 ${theme.page}`}
    >
      <div className="mx-auto max-w-[1600px]">
        <div
          ref={layoutRef}
          style={{ "--problem-panel-width": `${leftPanelWidth}%` }}
          className="grid grid-cols-1 gap-6 xl:grid-cols-[var(--problem-panel-width)_1.5rem_minmax(0,1fr)] xl:gap-0"
        >
          <section
            className={`animate-page-rise overflow-visible rounded-[2rem] border shadow-[0_30px_90px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-500 ${theme.panel}`}
          >
            {renderProblemTabs()}

            <div
              className={`relative overflow-hidden border-b p-6 transition-colors duration-500 sm:p-8 ${theme.hero}`}
            >
              <div className="animate-gentle-float pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className={`text-xs font-semibold uppercase tracking-[0.32em] ${theme.faint}`}>
                      Problem Workspace
                    </p>
                    <h1
                      className={`mt-3 font-[var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl ${theme.strong}`}
                    >
                      {problem.title}
                    </h1>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Pill className={getDifficultyBadgeColor(problem.difficulty, isDarkMode)}>
                        {problem.difficulty || "Unrated"}
                      </Pill>
                      {problemTags.length > 0 ? (
                        problemTags.map((tag) => (
                          <Pill
                            key={tag}
                            className={`${getTone("info", isDarkMode)} hover:-translate-y-0.5`}
                          >
                            {tag}
                          </Pill>
                        ))
                      ) : (
                        <Pill className={getTone("neutral", isDarkMode)}>General</Pill>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 lg:min-w-[420px] lg:items-end">
                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.ghost}`}
                      >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDarkMode((currentMode) => !currentMode)}
                        className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${theme.ghost}`}
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-sky-100/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center gap-2">
                          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {isDarkMode ? "Light" : "Dark"}
                        </span>
                      </button>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-3">
                      <StatTile
                        label="Examples"
                        value={visibleTestCases.length || 0}
                        helper="visible"
                        theme={theme}
                      />
                      <StatTile
                        label="Languages"
                        value={LANGUAGE_OPTIONS.length}
                        helper="supported"
                        theme={theme}
                      />
                      <StatTile
                        label="Layout"
                        value={`${leftPanelWidth.toFixed(0)}%`}
                        helper="drag divider"
                        theme={theme}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {renderProblemTabContent()}
            </div>
          </section>

          <div
            role="separator"
            aria-label="Resize problem and editor panels"
            aria-orientation="vertical"
            aria-valuemin={MIN_PANEL_WIDTH}
            aria-valuemax={MAX_PANEL_WIDTH}
            aria-valuenow={Math.round(leftPanelWidth)}
            tabIndex={0}
            onPointerDown={handleResizeStart}
            onDoubleClick={() => setLeftPanelWidth(DEFAULT_PANEL_WIDTH)}
            onKeyDown={handleResizeKeyDown}
            className="group hidden cursor-col-resize items-stretch justify-center px-2 outline-none xl:flex"
            title="Drag to resize. Double-click to reset."
          >
            <div className="relative flex w-full items-center justify-center">
              <div className="h-full w-px rounded-full bg-slate-300 transition-colors duration-300 group-hover:bg-sky-400" />
              <div
                className={`absolute flex h-16 w-8 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ${
                  isResizing
                    ? "scale-110 border-sky-300 bg-sky-500 text-white shadow-sky-500/30"
                    : `${theme.card} ${theme.faint} group-hover:scale-105 group-hover:text-sky-400`
                }`}
              >
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
          </div>

          <aside className="animate-panel-rise xl:sticky xl:top-6 xl:self-start">
            <div
              className={`overflow-hidden rounded-[2rem] border shadow-[0_30px_90px_-35px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 ${theme.panel}`}
            >
              <div className={`border-b p-5 transition-colors duration-300 sm:p-6 ${theme.card}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${theme.faint}`}>
                      Code Workspace
                    </p>
                    <h2 className={`mt-2 flex items-center gap-2 text-2xl font-bold ${theme.strong}`}>
                      <Code2 className="h-6 w-6 text-sky-500" />
                      Editor
                    </h2>
                    <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                      Choose a language, run against samples, and submit your final
                      solution.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:border-sky-300 ${theme.surface}`}
                    >
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.faint}`}>
                        Lang
                      </span>
                      <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className={`min-w-36 bg-transparent text-sm font-bold outline-none ${theme.strong}`}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={running}
                      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${theme.softButton}`}
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center gap-2">
                        {running ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        )}
                        {running ? "Running" : "Run"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${theme.submit}`}
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center gap-2">
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SendHorizontal className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        )}
                        {submitting ? "Submitting" : "Submit"}
                      </span>
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${getTone(
                      feedback.tone === "success" ? "success" : "danger",
                      isDarkMode
                    )}`}
                  >
                    {feedback.message}
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-3 transition-colors duration-300">
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 shadow-inner transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                      {selectedLanguage?.label || "Editor"}
                    </div>
                  </div>

                  <Editor
                    height="clamp(420px, 56vh, 720px)"
                    language={selectedLanguage?.editorLanguage || "javascript"}
                    value={currentCode}
                    onChange={(value) => updateCurrentCode(value || "")}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      smoothScrolling: true,
                      tabSize: 2,
                      padding: { top: 18 },
                    }}
                  />
                </div>
              </div>

              {renderBottomPanel()}
            </div>
          </aside>
        </div>

      </div>

    </main>
  );
}

export default ProblemPage;
