// src/components/LoginScreen.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ← import this

const LoginScreen: React.FC = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); // ← initialize

  const handleLogin = async () => {
    const payLoad = {
      username, // use lowercase 'username'
      password,
    };

    console.log("Sending Login Payload:", payLoad);

    try {
      const response = await fetch("http://15.207.98.116:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payLoad),
      });
      if (!response.ok) {
        throw new Error("Invalid Credentials or Server Error");
      }
      const data = await response.json();
      console.log(" Login Success:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      setSuccess("Login Successful!");

      // ⏩ Redirect to Admin Panel
      setTimeout(() => {
        navigate("/admin"); // ← change this path to match your AdminPanel route
      }, 1000); // optional delay for user feedback
    } catch (error) {
      console.error("Login error:", error);
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
