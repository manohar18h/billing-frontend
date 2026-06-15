// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp: number;
};

export const isTokenExpired = (token: string | null) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/login";
};