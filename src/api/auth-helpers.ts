import type { AuthTokens } from "@/types";

// Auth token management helpers
export const getAuthTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: refreshToken || "",
  };
};

export const setAuthTokens = (
  tokens: AuthTokens,
  role?: string,
  user?: any,
) => {
  if (typeof window === "undefined") return;

  // Store in localStorage
  localStorage.setItem("accessToken", tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }

  if (role) {
    localStorage.setItem("userRole", role);
  }

  if (user) {
    localStorage.setItem("userData", JSON.stringify(user));
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  localStorage.setItem("tokenExpiresAt", expiresAt.toISOString());
};

export const clearAuthTokens = () => {
  if (typeof window === "undefined") return;

  // Clear localStorage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userData");
  localStorage.removeItem("tokenExpiresAt");
  localStorage.removeItem("edu_user_data");
};

export const getCurrentUser = <T = any>(): T | null => {
  if (typeof window === "undefined") return null;
  const userData = localStorage.getItem("userData");
  if (!userData) return null;
  try {
    return JSON.parse(userData) as T;
  } catch {
    return null;
  }
};

export const getUserRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userRole");
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    if (!exp) return false; // If no exp claim, assume it doesn't expire
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (error) {
    return true; // If decoding fails, assume expired/invalid
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("accessToken");

  if (!token) return false;

  if (isTokenExpired(token)) {
    // Don't clear tokens if we have a refresh token — the interceptor will handle refresh
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      return true;
    }
    clearAuthTokens();
    return false;
  }

  return true;
};

