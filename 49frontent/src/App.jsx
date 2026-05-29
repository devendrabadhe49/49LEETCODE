import { Routes, Route, Navigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import Admin from "./pages/Admin";
import AdminPanel from "./components/AdminPanel";
import AdminUpdate from "./components/AdminUpdate";
import AdminDelete from "./components/AdminDelete";
import ProblemPage from "./pages/ProblemPage";
import { checkAuth } from "./authSlice";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const adminRouteElement = (element) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user?.role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return element;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Homepage /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route path="/admin" element={adminRouteElement(<Admin />)} />
      <Route path="/admin/create" element={adminRouteElement(<AdminPanel />)} />
      <Route path="/admin/update" element={adminRouteElement(<AdminUpdate />)} />
      <Route path="/admin/delete" element={adminRouteElement(<AdminDelete />)} />
      <Route path="/problem/:problemId" element={<ProblemPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
