import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState, User, UserRole } from "@/types";
import { setAuthTokens, clearAuthTokens } from "./auth-helpers";

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      _hasHydrated: false,

      // Actions
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),

      hasRole: (role: UserRole) => {
        return get().user?.role === role;
      },

      isStudent: () => {
        return get().user?.role === "STUDENT";
      },

      isTeacher: () => {
        const role = get().user?.role;
        return role === "TEACHER" || role === "ADMIN";
      },

      isSchool: () => {
        return get().user?.role === "SCHOOL";
      },

      login: (data: { user: User; token: string; refreshToken?: string }) => {
        // Use helper to set localStorage (so axios interceptors can read it)
        setAuthTokens(
          { accessToken: data.token, refreshToken: data.refreshToken || "" },
          data.user.role,
          data.user,
        );

        set({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken || null,
        });
      },

      logout: () => {
        // Use helper to clear localStorage
        clearAuthTokens();

        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: "edu-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

// Non-hook access for axios interceptors
export const getAuthToken = () => useAuthStore.getState().token;
export const getRefreshToken = () => useAuthStore.getState().refreshToken;
export const getAuthState = () => useAuthStore.getState();

