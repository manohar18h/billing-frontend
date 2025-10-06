import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080", // ✅ picks up from .env
});

// ✅ Request Interceptor — adds Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — handles expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 (Unauthorized), assume token expired or invalid
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Logging out automatically...");
      localStorage.removeItem("token");
      sessionStorage.clear();

      // Optional: Show a small alert or toast before redirect
      alert("Your session has expired. Please log in again.");

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
