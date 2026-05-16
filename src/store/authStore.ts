import { create } from "zustand";
import { authApi } from "@/api/whiskeyApi";
import { MeResponse } from "@/type/ApiInterface";

interface UserState {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: MeResponse | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (status: boolean) => void;

  // Async Actions
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setLoading: (status) => set({ isLoading: status }),

  /**
   * 서버로부터 현재 로그인된 사용자 정보를 가져와 스토어 업데이트
   */
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const userData = await authApi.me();
      console.log("[authStore] Fetched user from session:", userData);
      if (userData && (userData.uid || userData.authenticated)) {
        set({ user: userData, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  /**
   * 로그아웃 처리 및 스토어 초기화
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
