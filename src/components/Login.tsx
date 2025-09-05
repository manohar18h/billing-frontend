// src/components/LoginScreen.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ← import this
import api from "@/services/api"; // ← import your api.ts

interface LoginResponse {
  token: string;
  role: string;
}

const LoginScreen: React.FC = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); // ← initialize

  const handleLogin = async () => {
    const payload = { username, password };

    try {
      const response = await api.post<LoginResponse>("/auth/login", payload);
      const data = response.data;

      localStorage.removeItem("token");
      localStorage.removeItem("role");

      // Save token & role to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      setSuccess("Login Successful!");

      // Redirect based on role returned by backend
      if (data.role === "SALES") {
        setTimeout(() => navigate("/sales"), 1000);
      } else if (data.role === "ADMIN") {
        setTimeout(() => navigate("/admin"), 1000);
      } else {
        alert("Unknown role, please contact support.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
        alert(`Login failed: ${error.message}`);
      } else {
        console.error("Login error:", error);
        alert("Login failed! Unknown error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/back5.png')" }}
      ></div>

      {/* Login Glass Card */}
      <div className="relative z-20 w-full max-w-md bg-white/0 backdrop-blur-md border border-white/30 rounded-3xl p-8 shadow-lg text-white">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:brightness-110 text-white text-lg font-semibold py-3 rounded-xl shadow-lg transition-all duration-300"
          >
            Login
          </button>
          {success && (
            <p className="text-green-300 mt-2 text-center text-sm">{success}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
