import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NavLink, useNavigate } from "react-router";
import axiosClient from "../utill/axiosClient";

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const TAG_OPTIONS = [
  "Array",
  "String",
  "Dynamic Programming",
  "dp",
  "Graph",
  "Tree",
  "Math",
  "Greedy",
  "Backtracking",
  "Sorting",
  "Searching",
];
const LANGUAGE_SECTIONS = ["C++", "Java", "JavaScript"];

const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(DIFFICULTY_OPTIONS),
  tags: z.enum(TAG_OPTIONS),
  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input is required"),
        output: z.string().min(1, "Output is required"),
        explanation: z.string().min(1, "Explanation is required"),
      })
    )
    .min(1, "At least one visible test case is required"),
  hiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input is required"),
        output: z.string().min(1, "Output is required"),
      })
    )
    .min(1, "At least one hidden test case is required"),
  startCode: z
    .array(
      z.object({
        language: z.enum(LANGUAGE_SECTIONS),
        initialCode: z.string().min(1, "Initial code is required"),
      })
    )
    .length(3, "All three languages are required"),
  referenceSolution: z
    .array(
      z.object({
        language: z.enum(LANGUAGE_SECTIONS),
        completeCode: z.string().min(1, "Reference solution is required"),
      })
    )
    .length(3, "All three languages are required"),
});

const DEFAULT_VALUES = {
  title: "",
  description: "",
  difficulty: "Easy",
  tags: "Array",
  visibleTestCases: [{ input: "", output: "", explanation: "" }],
  hiddenTestCases: [{ input: "", output: "" }],
  startCode: [
    { language: "C++", initialCode: "" },
    { language: "Java", initialCode: "" },
    { language: "JavaScript", initialCode: "" },
  ],
  referenceSolution: [
    { language: "C++", completeCode: "" },
    { language: "Java", completeCode: "" },
    { language: "JavaScript", completeCode: "" },
  ],
};

const ensureLanguageOrder = (items = [], codeKey) =>
  LANGUAGE_SECTIONS.map((languageName) => {
    const existingValue = items.find((item) => item.language === languageName);

    return {
      language: languageName,
      [codeKey]: existingValue?.[codeKey] || "",
    };
  });

function AdminUpdate() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingProblemDetails, setLoadingProblemDetails] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    fields: visibleFields,
    replace: replaceVisible,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    replace: replaceHidden,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  const title = watch("title");
  const difficulty = watch("difficulty");
  const tag = watch("tags");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoadingProblems(true);
        setError("");
        const { data } = await axiosClient.get("/problem/getAllProblem");
        setProblems(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (fetchError.response?.status === 404) {
          setProblems([]);
        } else {
          setError("Failed to fetch problems");
          console.error(fetchError);
        }
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, []);

  const loadProblemDetails = async (problemId) => {
    if (!problemId) {
      setSelectedProblemId("");
      reset(DEFAULT_VALUES);
      replaceVisible(DEFAULT_VALUES.visibleTestCases);
      replaceHidden(DEFAULT_VALUES.hiddenTestCases);
      return;
    }

    try {
      setLoadingProblemDetails(true);
      setError("");
      const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);

      const normalizedValues = {
        title: data.title || "",
        description: data.description || "",
        difficulty: data.difficulty || "Easy",
        tags: data.tags || "Array",
        visibleTestCases:
          Array.isArray(data.visibleTestCases) && data.visibleTestCases.length > 0
            ? data.visibleTestCases
            : DEFAULT_VALUES.visibleTestCases,
        hiddenTestCases:
          Array.isArray(data.hiddenTestCases) && data.hiddenTestCases.length > 0
            ? data.hiddenTestCases
            : DEFAULT_VALUES.hiddenTestCases,
        startCode: ensureLanguageOrder(data.startCode, "initialCode"),
        referenceSolution: ensureLanguageOrder(
          data.referenceSolution,
          "completeCode"
        ),
      };

      setSelectedProblemId(problemId);
      reset(normalizedValues);
      replaceVisible(normalizedValues.visibleTestCases);
      replaceHidden(normalizedValues.hiddenTestCases);
    } catch (fetchError) {
      setError("Failed to load selected problem");
      console.error(fetchError);
    } finally {
      setLoadingProblemDetails(false);
    }
  };

  const onSubmit = async (formData) => {
    if (!selectedProblemId) {
      alert("Please select a problem to update first.");
      return;
    }

    try {
      await axiosClient.put(`/problem/update/${selectedProblemId}`, formData);
      alert("Problem updated successfully!");
      navigate("/admin");
    } catch (submitError) {
      alert(submitError.response?.data || submitError.message || "Failed to update problem");
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return [problem.title, problem.tags, problem.difficulty, problem._id]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="card bg-base-100 shadow-xl border border-base-300/60 mb-6">
          <div className="card-body p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="badge badge-warning badge-outline badge-lg mb-4">
                  Admin Update Flow
                </div>
                <h1 className="text-4xl font-bold">Update Problem</h1>
                <p className="mt-3 text-base-content/70 text-lg">
                  Existing problem select karo, current data load karo, aur
                  updated version publish kar do.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <NavLink to="/admin" className="btn btn-ghost">
                  Back to Admin
                </NavLink>
                <button
                  type="submit"
                  form="admin-update-form"
                  className={`btn btn-warning ${isSubmitting ? "btn-disabled" : ""}`}
                  disabled={isSubmitting || !selectedProblemId}
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6 xl:sticky xl:top-6 h-fit">
            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body">
                <div className="badge badge-outline mb-3">Select Problem</div>
                <h2 className="text-xl font-semibold">Choose What To Edit</h2>
                <p className="text-sm text-base-content/60 mt-2">
                  Search karke problem select karo. Form selected problem ke data
                  se fill ho jayega.
                </p>

                <label className="input input-bordered flex items-center gap-2 mt-4">
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search problems..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <div className="mt-4 space-y-3 max-h-[28rem] overflow-y-auto">
                  {loadingProblems ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner"></span>
                    </div>
                  ) : filteredProblems.length === 0 ? (
                    <div className="alert alert-info">
                      <div>
                        <span>No problems found.</span>
                      </div>
                    </div>
                  ) : (
                    filteredProblems.map((problem) => (
                      <button
                        key={problem._id}
                        type="button"
                        onClick={() => loadProblemDetails(problem._id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selectedProblemId === problem._id
                            ? "border-warning bg-warning/10"
                            : "border-base-300 bg-base-100 hover:bg-base-200"
                        }`}
                      >
                        <div className="font-semibold">{problem.title}</div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="badge badge-outline">{problem.difficulty}</span>
                          <span className="badge badge-outline">{problem.tags}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body">
                <div className="badge badge-outline mb-3">Current Draft</div>
                <h3 className="text-xl font-semibold">
                  {selectedProblemId ? title || "Untitled Problem" : "No problem selected"}
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge badge-warning badge-outline">{difficulty}</span>
                  <span className="badge badge-outline">{tag}</span>
                </div>
              </div>
            </div>
          </div>

          <form
            id="admin-update-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {error && (
              <div className="alert alert-error shadow-lg">
                <div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {!selectedProblemId && !loadingProblemDetails ? (
              <div className="alert alert-info shadow-lg">
                <div>
                  <span>Select a problem from the left panel to start editing.</span>
                </div>
              </div>
            ) : null}

            {loadingProblemDetails ? (
              <div className="card bg-base-100 shadow-xl border border-base-300/60">
                <div className="card-body flex items-center justify-center py-16">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              </div>
            ) : (
              <>
                <div className="card bg-base-100 shadow-xl border border-base-300/60">
                  <div className="card-body p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="badge badge-warning badge-outline mb-2">Step 1</div>
                        <h2 className="text-2xl font-semibold">Basic Information</h2>
                      </div>
                      <div className="badge badge-outline">
                        {selectedProblemId ? "Loaded" : "Waiting"}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Problem Title</span>
                        </label>
                        <input
                          {...register("title")}
                          className={`input input-bordered w-full ${
                            errors.title ? "input-error" : ""
                          }`}
                        />
                        {errors.title && (
                          <span className="text-error text-sm mt-1">
                            {errors.title.message}
                          </span>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Difficulty</span>
                          </label>
                          <select
                            {...register("difficulty")}
                            className={`select select-bordered ${
                              errors.difficulty ? "select-error" : ""
                            }`}
                          >
                            {DIFFICULTY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Tag</span>
                          </label>
                          <select
                            {...register("tags")}
                            className={`select select-bordered ${
                              errors.tags ? "select-error" : ""
                            }`}
                          >
                            {TAG_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Description</span>
                        </label>
                        <textarea
                          {...register("description")}
                          className={`textarea textarea-bordered h-40 ${
                            errors.description ? "textarea-error" : ""
                          }`}
                        />
                        {errors.description && (
                          <span className="text-error text-sm mt-1">
                            {errors.description.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-xl border border-base-300/60">
                  <div className="card-body p-6">
                    <h2 className="text-2xl font-semibold mb-4">Test Cases</h2>

                    <div className="space-y-8">
                      <div className="rounded-2xl bg-base-200/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className="font-semibold text-lg">Visible Test Cases</h3>
                          <button
                            type="button"
                            onClick={() =>
                              appendVisible({ input: "", output: "", explanation: "" })
                            }
                            className="btn btn-sm btn-warning"
                          >
                            Add Visible Case
                          </button>
                        </div>

                        <div className="space-y-4">
                          {visibleFields.map((field, index) => (
                            <div key={field.id} className="rounded-xl bg-base-100 p-4 shadow-sm">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="badge badge-outline">Example {index + 1}</div>
                                <button
                                  type="button"
                                  onClick={() => removeVisible(index)}
                                  className="btn btn-xs btn-error"
                                  disabled={visibleFields.length === 1}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid gap-3">
                                <input
                                  {...register(`visibleTestCases.${index}.input`)}
                                  className="input input-bordered w-full"
                                  placeholder="Input"
                                />
                                <input
                                  {...register(`visibleTestCases.${index}.output`)}
                                  className="input input-bordered w-full"
                                  placeholder="Output"
                                />
                                <textarea
                                  {...register(`visibleTestCases.${index}.explanation`)}
                                  className="textarea textarea-bordered w-full"
                                  placeholder="Explanation"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-base-200/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className="font-semibold text-lg">Hidden Test Cases</h3>
                          <button
                            type="button"
                            onClick={() => appendHidden({ input: "", output: "" })}
                            className="btn btn-sm btn-warning"
                          >
                            Add Hidden Case
                          </button>
                        </div>

                        <div className="space-y-4">
                          {hiddenFields.map((field, index) => (
                            <div key={field.id} className="rounded-xl bg-base-100 p-4 shadow-sm">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="badge badge-outline">Hidden {index + 1}</div>
                                <button
                                  type="button"
                                  onClick={() => removeHidden(index)}
                                  className="btn btn-xs btn-error"
                                  disabled={hiddenFields.length === 1}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid gap-3">
                                <input
                                  {...register(`hiddenTestCases.${index}.input`)}
                                  className="input input-bordered w-full"
                                  placeholder="Input"
                                />
                                <input
                                  {...register(`hiddenTestCases.${index}.output`)}
                                  className="input input-bordered w-full"
                                  placeholder="Output"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-xl border border-base-300/60">
                  <div className="card-body p-6">
                    <h2 className="text-2xl font-semibold mb-4">Language Templates</h2>

                    <div className="space-y-6">
                      {LANGUAGE_SECTIONS.map((languageName, index) => (
                        <div key={languageName} className="rounded-2xl bg-base-200/70 p-4">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="font-semibold text-lg">{languageName}</h3>
                            <div className="badge badge-outline">Template {index + 1}</div>
                          </div>

                          <div className="grid gap-4">
                            <div className="form-control">
                              <label className="label">
                                <span className="label-text">Starter Code</span>
                              </label>
                              <textarea
                                {...register(`startCode.${index}.initialCode`)}
                                className="textarea textarea-bordered font-mono h-40"
                              />
                            </div>

                            <div className="form-control">
                              <label className="label">
                                <span className="label-text">Reference Solution</span>
                              </label>
                              <textarea
                                {...register(`referenceSolution.${index}.completeCode`)}
                                className="textarea textarea-bordered font-mono h-40"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn btn-warning btn-lg w-full ${
                    isSubmitting ? "btn-disabled" : ""
                  }`}
                  disabled={isSubmitting || !selectedProblemId}
                >
                  {isSubmitting ? "Updating Problem..." : "Update Problem"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminUpdate;
