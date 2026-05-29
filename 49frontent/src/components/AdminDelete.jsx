import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utill/axiosClient";

const getDifficultyBadgeColor = (difficulty) => {
  switch (String(difficulty || "").toLowerCase()) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
    default:
      return "badge-neutral";
  }
};

function AdminDelete() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axiosClient.get("/problem/getAllProblem");
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setProblems([]);
      } else {
        setError("Failed to fetch problems");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) {
      return;
    }

    try {
      setDeletingId(id);
      await axiosClient.delete(`/problem/delete/${id}`);
      setProblems((currentProblems) =>
        currentProblems.filter((problem) => problem._id !== id)
      );
    } catch (err) {
      setError("Failed to delete problem");
      console.error(err);
    } finally {
      setDeletingId("");
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProblems = problems.filter((problem) => {
    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      problem.title,
      problem.tags,
      problem.difficulty,
      problem._id,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const easyCount = problems.filter(
    (problem) => String(problem.difficulty).toLowerCase() === "easy"
  ).length;
  const mediumCount = problems.filter(
    (problem) => String(problem.difficulty).toLowerCase() === "medium"
  ).length;
  const hardCount = problems.filter(
    (problem) => String(problem.difficulty).toLowerCase() === "hard"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="card bg-base-100 shadow-xl border border-base-300/60">
          <div className="card-body p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="badge badge-error badge-outline badge-lg mb-4">
                  Admin Delete Flow
                </div>
                <h1 className="text-4xl font-bold">Delete Problems</h1>
                <p className="mt-3 text-base-content/70 text-lg">
                  Existing problems ko search, review, aur safely remove karo.
                  Delete action direct catalog ko affect karega.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <NavLink to="/admin" className="btn btn-ghost">
                  Back to Admin
                </NavLink>
                <button onClick={fetchProblems} className="btn btn-outline">
                  Refresh List
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="stat bg-base-100 rounded-2xl shadow-lg border border-base-300/60">
            <div className="stat-title">Total Problems</div>
            <div className="stat-value text-3xl">{problems.length}</div>
          </div>
          <div className="stat bg-base-100 rounded-2xl shadow-lg border border-base-300/60">
            <div className="stat-title">Easy</div>
            <div className="stat-value text-3xl text-success">{easyCount}</div>
          </div>
          <div className="stat bg-base-100 rounded-2xl shadow-lg border border-base-300/60">
            <div className="stat-title">Medium</div>
            <div className="stat-value text-3xl text-warning">{mediumCount}</div>
          </div>
          <div className="stat bg-base-100 rounded-2xl shadow-lg border border-base-300/60">
            <div className="stat-title">Hard</div>
            <div className="stat-value text-3xl text-error">{hardCount}</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300/60">
          <div className="card-body p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Problem Catalog</h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Search by title, difficulty, tag, ya problem id.
                </p>
              </div>

              <label className="input input-bordered flex items-center gap-2 w-full md:w-96">
                <input
                  type="text"
                  className="grow"
                  placeholder="Search problems..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg">
            <div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {problems.length === 0 ? (
          <div className="alert alert-info shadow-lg">
            <div>
              <span>No problems available to delete right now.</span>
            </div>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="alert alert-info shadow-lg">
            <div>
              <span>No problems match the current search.</span>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl border border-base-300/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Tag</th>
                    <th>Problem ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem, index) => (
                    <tr key={problem._id}>
                      <th>{index + 1}</th>
                      <td>
                        <div className="font-medium">{problem.title}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">{problem.tags}</span>
                      </td>
                      <td className="font-mono text-xs">{problem._id}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <NavLink
                            to={`/problem/${problem._id}`}
                            className="btn btn-sm btn-outline"
                          >
                            Preview
                          </NavLink>
                          <button
                            onClick={() => handleDelete(problem._id)}
                            className={`btn btn-sm btn-error ${
                              deletingId === problem._id ? "btn-disabled" : ""
                            }`}
                            disabled={deletingId === problem._id}
                          >
                            {deletingId === problem._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDelete;
