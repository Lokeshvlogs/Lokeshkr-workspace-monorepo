"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LOGIN_REDIRECT_URL = "/";
const LOGOUT_REDIRECT_URL = "/";
const LOGIN_REQUIRED_URL = "/login";
const PROFILE_REQUIRED_URL = "/profile/register";
const LOCAL_STORAGE_KEY = "is-logged-in";
const LOCAL_USERNAME_KEY = "username";

/* ---------- Types ---------- */

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string;
  login: (username?: string) => void;
  logout: () => void;
  loginRequiredRedirect: () => void;
}

/* ---------- Context ---------- */
const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/* ---------- Provider ---------- */

export function AuthProvider({ children }: AuthProviderProps) {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedAuthStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedAuthStatus) {
      setIsAuthenticated(parseInt(storedAuthStatus) === 1);
    }

    const storedUn = localStorage.getItem(LOCAL_USERNAME_KEY);
    if (storedUn) {
      setUsername(storedUn);
    }
  }, []);

  const login = (username?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_KEY, "1");

    if (username) {
      localStorage.setItem(LOCAL_USERNAME_KEY, username);
      setUsername(username);
    } else {
      localStorage.removeItem(LOCAL_USERNAME_KEY);
    }

    const nextUrl = searchParams.get("next");
    const invalidNextUrl = ["/login", "/logout"];
    const nextUrlValid =
      !!nextUrl &&
      nextUrl.startsWith("/") &&
      !invalidNextUrl.includes(nextUrl);

    if (nextUrlValid) {
      console.log("Redirecting to nextUrl:", nextUrl);
      router.replace(nextUrl);
    } else {
      console.log("Redirecting to LOGIN_REDIRECT_URL");

    const profileCompleted = localStorage.getItem("profile-completed");
    const profile = profileCompleted === "1" || profileCompleted === "true" ? true : false;

      if (profile) {
        console.log("Profile completed, redirecting to LOGIN_REDIRECT_URL");
        router.replace(LOGIN_REDIRECT_URL);
      } else {
        console
        router.replace(PROFILE_REQUIRED_URL);
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, "0");
    router.replace(LOGOUT_REDIRECT_URL);
  };

  const loginRequiredRedirect = () => {
    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, "0");

    let loginWithNextUrl = `${LOGIN_REQUIRED_URL}?next=${pathname}`;

    if (pathname === LOGIN_REQUIRED_URL) {
      loginWithNextUrl = LOGIN_REQUIRED_URL;
    }

    router.replace(loginWithNextUrl);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        loginRequiredRedirect,
        username,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ---------- Hook ---------- */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}