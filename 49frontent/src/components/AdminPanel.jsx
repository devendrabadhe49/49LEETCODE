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

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
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
    },
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  const title = watch("title");
  const description = watch("description");
  const difficulty = watch("difficulty");
  const tag = watch("tags");
  const visibleTestCases = watch("visibleTestCases");
  const hiddenTestCases = watch("hiddenTestCases");

  const onSubmit = async (formData) => {
    try {
      await axiosClient.post("/problem/create", formData);
      alert("Problem created successfully!");
      navigate("/admin");
    } catch (error) {
      alert(error.response?.data || error.message || "Failed to create problem");
    }
  };

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="card bg-base-100 shadow-xl border border-base-300/60 mb-6">
          <div className="card-body p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="badge badge-outline badge-lg mb-4">Admin Create Flow</div>
                <h1 className="text-4xl font-bold">Create New Problem</h1>
                <p className="mt-3 text-base-content/70 text-lg">
                  Problem statement, examples, hidden tests, starter code, aur
                  reference solutions ek hi workflow mein add karo.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <NavLink to="/admin" className="btn btn-ghost">
                  Back to Admin
                </NavLink>
                <button
                  type="submit"
                  form="admin-create-form"
                  className={`btn btn-primary ${isSubmitting ? "btn-disabled" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Publish Problem"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            id="admin-create-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="badge badge-primary badge-outline mb-2">Step 1</div>
                    <h2 className="text-2xl font-semibold">Basic Information</h2>
                  </div>
                  <div className="badge badge-outline">{difficulty}</div>
                </div>

                <div className="space-y-5">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Problem Title</span>
                    </label>
                    <input
                      {...register("title")}
                      placeholder="Example: Two Sum"
                      className={`input input-bordered w-full ${
                        errors.title ? "input-error" : ""
                      }`}
                    />
                    {errors.title && (
                      <span className="text-error text-sm mt-1">{errors.title.message}</span>
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
                        <span className="label-text">Topic Tag</span>
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
                      <span className="label-text">Problem Description</span>
                      <span className="label-text-alt">
                        {String(description || "").length} chars
                      </span>
                    </label>
                    <textarea
                      {...register("description")}
                      placeholder="Explain the problem, constraints, and expected behavior."
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
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="badge badge-secondary badge-outline mb-2">Step 2</div>
                    <h2 className="text-2xl font-semibold">Test Cases</h2>
                  </div>
                  <div className="badge badge-outline">
                    {visibleFields.length + hiddenFields.length} total cases
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="rounded-2xl bg-base-200/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Visible Test Cases</h3>
                        <p className="text-sm text-base-content/60">
                          Ye examples problem statement ke saath show honge.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          appendVisible({ input: "", output: "", explanation: "" })
                        }
                        className="btn btn-sm btn-primary"
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
                              placeholder="Input"
                              className="input input-bordered w-full"
                            />
                            <input
                              {...register(`visibleTestCases.${index}.output`)}
                              placeholder="Output"
                              className="input input-bordered w-full"
                            />
                            <textarea
                              {...register(`visibleTestCases.${index}.explanation`)}
                              placeholder="Explanation"
                              className="textarea textarea-bordered w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.visibleTestCases?.message && (
                      <p className="text-error text-sm mt-3">
                        {errors.visibleTestCases.message}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-base-200/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Hidden Test Cases</h3>
                        <p className="text-sm text-base-content/60">
                          Ye judge ke liye use honge aur users ko visible nahi honge.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendHidden({ input: "", output: "" })}
                        className="btn btn-sm btn-primary"
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
                              placeholder="Input"
                              className="input input-bordered w-full"
                            />
                            <input
                              {...register(`hiddenTestCases.${index}.output`)}
                              placeholder="Output"
                              className="input input-bordered w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.hiddenTestCases?.message && (
                      <p className="text-error text-sm mt-3">
                        {errors.hiddenTestCases.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="badge badge-accent badge-outline mb-2">Step 3</div>
                    <h2 className="text-2xl font-semibold">Language Templates</h2>
                  </div>
                  <div className="badge badge-outline">3 languages</div>
                </div>

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
                            placeholder={`Write the initial ${languageName} boilerplate here.`}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Reference Solution</span>
                          </label>
                          <textarea
                            {...register(`referenceSolution.${index}.completeCode`)}
                            className="textarea textarea-bordered font-mono h-40"
                            placeholder={`Write the accepted ${languageName} solution here.`}
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
              className={`btn btn-primary btn-lg w-full ${
                isSubmitting ? "btn-disabled" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Problem..." : "Create Problem"}
            </button>
          </form>

          <div className="space-y-6 xl:sticky xl:top-6 h-fit">
            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body">
                <div className="badge badge-outline mb-3">Live Summary</div>
                <h3 className="text-xl font-semibold">{title || "Untitled Problem"}</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge badge-primary badge-outline">{difficulty}</span>
                  <span className="badge badge-outline">{tag}</span>
                </div>

                <div className="divider my-3"></div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/60">Description</span>
                    <span>{String(description || "").length} chars</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/60">Visible cases</span>
                    <span>{visibleTestCases?.length || 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/60">Hidden cases</span>
                    <span>{hiddenTestCases?.length || 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/60">Languages</span>
                    <span>{LANGUAGE_SECTIONS.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-300/60">
              <div className="card-body">
                <div className="badge badge-outline mb-3">Checklist</div>
                <ul className="space-y-3 text-sm text-base-content/70">
                  <li>Title aur description clear hone chahiye.</li>
                  <li>Kam se kam 1 visible aur 1 hidden test case hona chahiye.</li>
                  <li>Har language ke liye starter code aur reference solution required hai.</li>
                  <li>Reference solution judge validation pass karega tabhi problem create hogi.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
