import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BuyInsurance from "./pages/BuyInsurance";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectRoute"; 
import AdminDashboard from "./pages/admin/dashboard";
import AdminPolicy from "./pages/admin/policy";
import AdminClaim from "./pages/admin/claim";
import ViewUserPolicies from "./pages/ViewUserPolicies";
import Claim from "./pages/Claim";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
       {/* Public Routes */}
       <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Protected Routes */}
        <Route 
          path="/buy-insurance" 
          element={
            <ProtectedRoute role="POLICY_HOLDER_ROLE">
              <BuyInsurance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/view-policy" 
          element={
            <ProtectedRoute role="POLICY_HOLDER_ROLE">
              <ViewUserPolicies />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/claim" 
          element={
            <ProtectedRoute role="POLICY_HOLDER_ROLE">
              <Claim />
            </ProtectedRoute>
          } 
        />

        {/* Admin Protected Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="ADMIN_ROLE">
              <AdminDashboard />
              <AdminPolicy />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-policy" 
          element={
            <ProtectedRoute role="ADMIN_ROLE">
              <AdminPolicy />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-claim" 
          element={
            <ProtectedRoute role="ADMIN_ROLE">
              <AdminClaim />
            </ProtectedRoute>
          } 
        />


      </Routes>
    </Router>
  );
};

export default App;
