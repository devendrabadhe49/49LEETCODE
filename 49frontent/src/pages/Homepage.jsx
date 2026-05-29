import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utill/axiosClient";
import { logoutUser } from "../authSlice";

const TAG_OPTIONS = [
  { value: "all", label: "All Tags" },
  { value: "array", label: "Array" },
  { value: "string", label: "String" },
  { value: "dynamic programming", label: "Dynamic Programming" },
  { value: "dp", label: "DP" },
  { value: "graph", label: "Graph" },
  { value: "tree", label: "Tree" },
  { value: "math", label: "Math" },
  { value: "greedy", label: "Greedy" },
  { value: "backtracking", label: "Backtracking" },
  { value: "sorting", label: "Sorting" },
  { value: "searching", label: "Searching" },
];

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const getDifficultyBadgeColor = (difficulty) => {
  switch (normalizeValue(difficulty)) {
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

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get("/problem/getAllProblem");
        setProblems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.response?.status === 404) {
          setProblems([]);
          return;
        }

        console.error("Error fetching problems:", error);
      }
    };

    const fetchSolvedProblems = async () => {
      if (!user) {
        setSolvedProblems([]);
        return;
      }

      try {
        const { data } = await axiosClient.get("/problem/problemSolvedByUser");
        setSolvedProblems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching solved problems:", error);
      }
    };

    fetchProblems();
    fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const filteredProblems = problems.filter((problem) => {
    const normalizedDifficulty = normalizeValue(problem.difficulty);
    const normalizedTag = normalizeValue(problem.tags);
    const isSolved = solvedProblems.some((submitted) => submitted._id === problem._id);

    const difficultyMatch =
      filters.difficulty === "all" || normalizedDifficulty === filters.difficulty;
    const tagMatch = filters.tag === "all" || normalizedTag === filters.tag;
    const statusMatch = filters.status !== "solved" || isSolved;

    return difficultyMatch && tagMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
          <NavLink to="/" className="brand-nav-link">
            <span className="brand-kicker">Problem Solving Platform</span>
            <span className="brand-wordmark brand-wordmark--sm">CodeIQ</span>
          </NavLink>
        </div>

        <div className="flex-none gap-4">
          {user?.role === "admin" && (
            <NavLink to="/admin" className="btn btn-outline btn-primary btn-sm sm:btn-md">
              Admin Panel
            </NavLink>
          )}

          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost">
              {user?.firstName}
            </div>
            <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="select select-bordered"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved Problems</option>
          </select>

          <select
            className="select select-bordered"
            value={filters.difficulty}
            onChange={(event) =>
              setFilters((current) => ({ ...current, difficulty: event.target.value }))
            }
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="select select-bordered"
            value={filters.tag}
            onChange={(event) =>
              setFilters((current) => ({ ...current, tag: event.target.value }))
            }
          >
            {TAG_OPTIONS.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="alert alert-info shadow-lg">
            <div>
              <span>No problems match the selected filters.</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProblems.map((problem) => {
              const isSolved = solvedProblems.some(
                (submitted) => submitted._id === problem._id
              );

              return (
                <div key={problem._id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="card-title">
                        <NavLink
                          to={`/problem/${problem._id}`}
                          className="hover:text-primary"
                        >
                          {problem.title}
                        </NavLink>
                      </h2>

                      {isSolved && <div className="badge badge-success">Solved</div>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </div>
                      <div className="badge badge-info">{problem.tags}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Homepage;
