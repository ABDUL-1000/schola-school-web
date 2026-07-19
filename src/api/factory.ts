import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import type { ApiResponse, AuthTokens } from "@/types";
import {
  getAuthToken,
  getRefreshToken,
  getAuthState,
  useAuthStore,
} from "./store";
import { isTokenExpired } from "./auth-helpers";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export interface ApiClientConfig {
  baseURL: string;
  refreshPath?: string;
  onAuthFailure?: () => void;
}

export const createApiClient = (config: ApiClientConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Mutex to prevent concurrent refresh attempts
  let isRefreshing = false;
  let refreshPromise: Promise<AuthTokens | null> | null = null;

  const attemptTokenRefresh = async (): Promise<AuthTokens | null> => {
    // Get refresh token from store first, then fallback to localStorage
    let refreshToken = getRefreshToken();
    if (!refreshToken && typeof window !== "undefined") {
      refreshToken = localStorage.getItem("refreshToken");
    }

    if (!refreshToken) return null;

    try {
      const refreshPath = config.refreshPath || "/auth/refresh";
      const response = await axios.post<ApiResponse<AuthTokens>>(
        `${config.baseURL}${refreshPath}`,
        { refreshToken },
        { withCredentials: true },
      );

      if (response.data.success && response.data.data) {
        const newTokens = response.data.data;
        const { login, user } = getAuthState();

        if (user) {
          login({
            user,
            token: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          });
        }

        return newTokens;
      }

      return null;
    } catch {
      return null;
    }
  };

  const refreshTokenIfNeeded = async (): Promise<string | null> => {
    if (isRefreshing && refreshPromise) {
      const tokens = await refreshPromise;
      return tokens?.accessToken || null;
    }

    isRefreshing = true;
    refreshPromise = attemptTokenRefresh();

    try {
      const tokens = await refreshPromise;
      return tokens?.accessToken || null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  };

  // Request interceptor: add token to headers, proactively refresh if expired
  instance.interceptors.request.use(
    async (axiosConfig) => {
      let token = getAuthToken();

      // Proactive refresh: if access token is expired but refresh token exists, refresh first
      if (token && isTokenExpired(token)) {
        const newToken = await refreshTokenIfNeeded();
        if (newToken) {
          token = newToken;
        } else {
          // Refresh failed — force logout
          useAuthStore.getState().logout();
          if (config.onAuthFailure) {
            config.onAuthFailure();
          }
        }
      }

      if (token) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
      return axiosConfig;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: handle 401 and errors
  instance.interceptors.response.use(
    (response) => {
      const data = response.data;
      // If the response follows the backend standard structure but has success=false
      if (data && typeof data === "object" && data.success === false) {
        throw new APIError(
          response.status,
          data.message || "An error occurred",
          data,
        );
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Handle 401 Unauthorized (fallback if proactive refresh missed it)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const newToken = await refreshTokenIfNeeded();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        }

        // Refresh failed
        useAuthStore.getState().logout();
        if (config.onAuthFailure) {
          config.onAuthFailure();
        }
        return Promise.reject(error);
      }

      // Extract message from server response if available
      if (error.response) {
        const data = error.response.data as any;
        const message = data?.message || error.message;
        const apiError = new APIError(error.response.status, message, data);
        return Promise.reject(apiError);
      }

      // Handle network errors
      if (!error.response) {
        return Promise.reject(
          new APIError(0, "Network error. Please check your connection."),
        );
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

// Helper function for making API calls
export const makeApiCall = async <T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
): Promise<T> => {
  const response = await client(config);
  return response.data;
};

