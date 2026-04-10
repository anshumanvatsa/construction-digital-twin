import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, authStorage, unauthenticatedRequest } from "@/lib/api";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  role: "admin" | "manager" | "viewer";
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "auth_user";

function readPersistedAuth() {
  const token = localStorage.getItem(authStorage.tokenKey);
  const refreshToken = localStorage.getItem(authStorage.refreshTokenKey);
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!token || !refreshToken || !rawUser) {
    return { token: null, refreshToken: null, user: null as AuthUser | null };
  }

  try {
    return { token, refreshToken, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    authStorage.clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    return { token: null, refreshToken: null, user: null as AuthUser | null };
  }
}

function clearPersistedAuth() {
  authStorage.clearTokens();
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(authStorage.refreshTokenKey);
    if (refreshToken) {
      void unauthenticatedRequest("/auth/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
      }).catch(() => {
        // Ignore logout endpoint failures and clear local session regardless.
      });
    }

    setToken(null);
    setUser(null);
    clearPersistedAuth();
  }, []);

  const persistSession = useCallback((nextToken: string, nextRefreshToken: string, nextUser: AuthUser) => {
    authStorage.setTokens(nextToken, nextRefreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await unauthenticatedRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!payload.access_token || !payload.refresh_token || !payload.user) {
      throw new ApiError("Login failed: missing token or user payload.", 500);
    }

    persistSession(payload.access_token, payload.refresh_token, payload.user);
  }, [persistSession]);

  useEffect(() => {
    const persisted = readPersistedAuth();
    setToken(persisted.token);
    setUser(persisted.user);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
