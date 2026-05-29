import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axiosClient from "../utill/axiosClient";

const normalizeLanguageKey = (language) => {
  const normalized = String(language || "").trim().toLowerCase();

  switch (normalized) {
    case "cpp":
    case "c++":
    case "cplusplus":
      return "cpp";
    case "js":
    case "javascript":
      return "javascript";
    case "java":
      return "java";
    case "py":
    case "python":
    case "python3":
      return "python";
    default:
      return "javascript";
  }
};

const getEditorLanguage = (language) => {
  switch (normalizeLanguageKey(language)) {
    case "cpp":
      return "cpp";
    case "java":
      return "java";
    case "python":
      return "python";
    case "javascript":
    default:
      return "javascript";
  }
};

const getStatusColor = (status) => {
  switch (String(status || "").trim().toLowerCase()) {
    case "accepted":
      return "badge-success";
    case "wrong":
      return "badge-error";
    case "error":
      return "badge-warning";
    case "pending":
      return "badge-info";
    default:
      return "badge-neutral";
  }
};

const formatMemory = (memory) => {
  if (memory === null || memory === undefined || memory === "") {
    return "0 kB";
  }

  const numericValue = Number(memory);

  if (Number.isNaN(numericValue)) {
    return `${memory} kB`;
  }

  if (numericValue < 1024) {
    return `${numericValue} kB`;
  }

  return `${(numericValue / 1024).toFixed(2)} MB`;
};

const formatRuntime = (runtime) => {
  if (runtime === null || runtime === undefined || runtime === "") {
    return "0s";
  }

  return `${runtime}s`;
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "-";
  }

  return new Date(dateString).toLocaleString();
};

function SubmissionHistory({ problemId, refreshKey = 0 }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    if (!problemId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosClient.get(
          `/problem/submittedProblemByUser/${problemId}`
        );

        const submissionList = Array.isArray(response.data) ? response.data : [];
        submissionList.sort(
          (firstSubmission, secondSubmission) =>
            new Date(secondSubmission.createdAt) - new Date(firstSubmission.createdAt)
        );

        setSubmissions(submissionList);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Failed to fetch submission history.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId, refreshKey]);

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300/60">
      <div className="card-body gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="badge badge-outline mb-3">Submission Timeline</div>
            <h2 className="text-2xl font-bold">Submission History</h2>
            <p className="text-base-content/70 mt-2">
              Review previous attempts, compare performance, and reopen submitted code with
              syntax highlighting.
            </p>
          </div>

          <div className="badge badge-lg badge-outline">
            {submissions.length} submission{submissions.length === 1 ? "" : "s"}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-base-300 bg-base-200/50 p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-base-content/70">
              Submit your first accepted or partial attempt and it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-base-300/60">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Passed</th>
                  <th>Submitted</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={submission._id}>
                    <td>{index + 1}</td>
                    <td className="font-mono">{submission.language}</td>
                    <td>
                      <span className={`badge ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="font-mono">{formatRuntime(submission.runtime)}</td>
                    <td className="font-mono">{formatMemory(submission.memory)}</td>
                    <td className="font-mono">
                      {submission.testCasesPassed}/{submission.testCasesTotal}
                    </td>
                    <td>{formatDate(submission.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-primary"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        View Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-6xl rounded-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-bold">Submission Details</h3>
                <p className="text-base-content/70">
                  {selectedSubmission.language} submission from{" "}
                  {formatDate(selectedSubmission.createdAt)}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <span className={`badge badge-lg ${getStatusColor(selectedSubmission.status)}`}>
                {selectedSubmission.status}
              </span>
              <span className="badge badge-outline badge-lg">
                Runtime: {formatRuntime(selectedSubmission.runtime)}
              </span>
              <span className="badge badge-outline badge-lg">
                Memory: {formatMemory(selectedSubmission.memory)}
              </span>
              <span className="badge badge-outline badge-lg">
                Passed: {selectedSubmission.testCasesPassed}/{selectedSubmission.testCasesTotal}
              </span>
            </div>

            {selectedSubmission.errorMessage && (
              <div className="alert alert-error mb-5">
                <span>{selectedSubmission.errorMessage}</span>
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-900/70 bg-slate-950">
              <Editor
                height="380px"
                language={getEditorLanguage(selectedSubmission.language)}
                value={selectedSubmission.code || ""}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionHistory;
