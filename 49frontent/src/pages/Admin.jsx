import { NavLink } from "react-router";
import { useSelector } from "react-redux";

function Admin() {
  const { user } = useSelector((state) => state.auth);

  const adminOptions = [
    {
      id: "create",
      title: "Create Problem",
      description:
        "Publish a new coding challenge with examples, starter code, and reference solutions.",
      color: "btn-primary",
      badge: "Ready",
      route: "/admin/create",
    },
    {
      id: "update",
      title: "Update Problem",
      description:
        "Load an existing problem, edit its statement or tests, and publish the updated version.",
      color: "btn-warning",
      badge: "Editor",
      route: "/admin/update",
    },
    {
      id: "delete",
      title: "Delete Problem",
      description:
        "Review the current catalog and remove outdated or incorrect problems safely.",
      color: "btn-error",
      badge: "Danger Zone",
      route: "/admin/delete",
    },
  ];

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="hero bg-base-100 rounded-3xl shadow-xl mb-8">
          <div className="hero-content w-full flex-col items-start gap-6 p-8 lg:p-10">
            <div className="badge badge-outline badge-lg">Admin Workspace</div>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold text-base-content">Admin Panel</h1>
              <p className="mt-3 text-base-content/70 text-lg">
                Welcome {user?.firstName || "Admin"}, yahan se problem catalog create aur
                manage kar sakte ho.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <NavLink to="/" className="btn btn-ghost">
                Back to Problems
              </NavLink>
              <NavLink to="/admin/create" className="btn btn-primary">
                Create New Problem
              </NavLink>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {adminOptions.map((option) => (
            <div
              key={option.id}
              className="card bg-base-100 shadow-xl transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="card-body p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-base-content/50">
                      {option.id}
                    </p>
                    <h2 className="card-title mt-2 text-2xl">{option.title}</h2>
                  </div>
                  <div
                    className={`badge badge-lg ${
                      option.id === "delete"
                        ? "badge-error"
                        : option.id === "update"
                          ? "badge-warning"
                          : "badge-primary"
                    }`}
                  >
                    {option.badge}
                  </div>
                </div>

                <p className="mt-4 text-base-content/70">{option.description}</p>

                <div className="card-actions mt-6">
                  <NavLink to={option.route} className={`btn ${option.color}`}>
                    {option.title}
                  </NavLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;
