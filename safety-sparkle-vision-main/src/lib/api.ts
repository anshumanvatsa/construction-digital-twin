export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

const API_BASE_URL = "http://localhost:8000";
const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "auth_refresh_token";

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type ErrorPayload = {
  detail?: unknown;
  error?: {
    message?: string;
  };
};

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function setStoredTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function getTokenExpiryEpochSeconds(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const parsed = JSON.parse(json) as { exp?: number };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenExpiringSoon(token: string, withinSeconds = 60): boolean {
  const exp = getTokenExpiryEpochSeconds(token);
  if (!exp) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= withinSeconds;
}

function dispatchUnauthorized() {
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string" && payload) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const casted = payload as ErrorPayload;
    if (casted.error?.message) {
      return casted.error.message;
    }
    if (typeof casted.detail === "string") {
      return casted.detail;
    }
  }

  return "Request failed";
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearStoredTokens();
    dispatchUnauthorized();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      clearStoredTokens();
      dispatchUnauthorized();
      return null;
    }

    const parsed = payload as RefreshResponse;
    if (!parsed.access_token || !parsed.refresh_token) {
      clearStoredTokens();
      dispatchUnauthorized();
      return null;
    }

    setStoredTokens(parsed.access_token, parsed.refresh_token);
    return parsed.access_token;
  })()
    .catch(() => {
      clearStoredTokens();
      dispatchUnauthorized();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers ?? {});

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let token = getStoredToken();

  if (auth) {
    if (!token) {
      dispatchUnauthorized();
      throw new ApiError("You need to login before making this request.", 401);
    }

    if (isAccessTokenExpiringSoon(token)) {
      const refreshedToken = await refreshAccessToken();
      if (!refreshedToken) {
        throw new ApiError("Session expired. Please login again.", 401);
      }
      token = refreshedToken;
    }

    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const execute = async (headersToUse: Headers) => {
    const response = await fetch(buildUrl(path), {
      ...rest,
      headers: headersToUse,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    return { response, payload };
  };

  let { response, payload } = await execute(requestHeaders);

  if (response.status === 401 && auth) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      const retryHeaders = new Headers(requestHeaders);
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
      ({ response, payload } = await execute(retryHeaders));
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredTokens();
      dispatchUnauthorized();
    }

    throw new ApiError(extractErrorMessage(payload), response.status);
  }

  return payload as T;
}

export async function unauthenticatedRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, auth: false });
}

export const authStorage = {
  tokenKey: TOKEN_STORAGE_KEY,
  refreshTokenKey: REFRESH_TOKEN_STORAGE_KEY,
  setTokens: setStoredTokens,
  clearTokens: clearStoredTokens,
};
