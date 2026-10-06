import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import Dashboard from "./pages/dashboard/Dashboard";
import NewTree from "./pages/dashboard/NewTree";

import InterviewWorkspace from "./pages/interview/InterviewWorkspace";

import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* PUBLIC */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* PROTECTED */}

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/trees/new"
            element={<NewTree />}
          />

          <Route
            path="/trees/:treeId"
            element={
              <InterviewWorkspace />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;