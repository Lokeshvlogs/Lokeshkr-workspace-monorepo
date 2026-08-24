"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import { clearProfileDraft } from "@/lib/profileDraft";

const LOGIN_REDIRECT_URL = "/";
const LOGOUT_REDIRECT_URL = "/";
const LOGIN_REQUIRED_URL = "/login";
const PROFILE_REQUIRED_URL = "/profile/register";
const LOCAL_STORAGE_KEY = "is-logged-in";
const LOCAL_USERNAME_KEY = "username";
const LOCAL_PROFILE_COMPLETE_KEY = "profile-completed";
const LOCAL_PROFILE_ID_KEY = "profile-id";

/* ---------- Types ---------- */

export interface LoginDetails {
  username?: string;
  /** Server-side verdict: profile completeness >= 95%. */
  isProfileComplete?: boolean;
  profileId?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string;
  profileId: string;
  isProfileComplete: boolean;
  login: (details?: LoginDetails) => void;
  logout: () => void;
  loginRequiredRedirect: () => void;
  setProfileComplete: (complete: boolean) => void;
}

/* ---------- Context ---------- */
const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/* ---------- Provider ---------- */

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [profileId, setProfileId] = useState<string>("");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedAuthStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedAuthStatus) {
      setIsAuthenticated(parseInt(storedAuthStatus) === 1);
    }

    const storedUn = localStorage.getItem(LOCAL_USERNAME_KEY);
    if (storedUn) {
      setUsername(storedUn);
    }

    const storedProfileId = localStorage.getItem(LOCAL_PROFILE_ID_KEY);
    if (storedProfileId) {
      setProfileId(storedProfileId);
    }

    const storedComplete = localStorage.getItem(LOCAL_PROFILE_COMPLETE_KEY);
    setIsProfileComplete(storedComplete === "1" || storedComplete === "true");
  }, []);

  const login = (details: LoginDetails = {}) => {
    const { username: loggedInUser, isProfileComplete: complete = false, profileId: id } = details;

    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_KEY, "1");

    if (loggedInUser) {
      localStorage.setItem(LOCAL_USERNAME_KEY, loggedInUser);
      setUsername(loggedInUser);
    } else {
      localStorage.removeItem(LOCAL_USERNAME_KEY);
    }

    if (id) {
      localStorage.setItem(LOCAL_PROFILE_ID_KEY, id);
      setProfileId(id);
    }

    localStorage.setItem(LOCAL_PROFILE_COMPLETE_KEY, complete ? "1" : "0");
    setIsProfileComplete(complete);

    const searchParams = new URLSearchParams(window.location.search);
    const nextUrl = searchParams.get("next");
    const invalidNextUrl = ["/login", "/logout"];
    const nextUrlValid =
      !!nextUrl &&
      nextUrl.startsWith("/") &&
      !invalidNextUrl.includes(nextUrl);

    if (nextUrlValid) {
      router.replace(nextUrl);
      return;
    }

    // An incomplete profile goes back into the registration wizard; a complete
    // one lands on the home page, where matches are shown.
    router.replace(complete ? LOGIN_REDIRECT_URL : PROFILE_REQUIRED_URL);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsProfileComplete(false);
    setUsername("");
    setProfileId("");
    localStorage.setItem(LOCAL_STORAGE_KEY, "0");
    localStorage.removeItem(LOCAL_USERNAME_KEY);
    localStorage.removeItem(LOCAL_PROFILE_ID_KEY);
    localStorage.removeItem(LOCAL_PROFILE_COMPLETE_KEY);
    // An unfinished wizard must not survive into the next session on this
    // device. The draft is owner-stamped as well, so this is belt-and-braces
    // for the case where logout does run.
    clearProfileDraft();
    router.replace(LOGOUT_REDIRECT_URL);
  };

  const setProfileComplete = (complete: boolean) => {
    setIsProfileComplete(complete);
    localStorage.setItem(LOCAL_PROFILE_COMPLETE_KEY, complete ? "1" : "0");
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
        isProfileComplete,
        profileId,
        login,
        logout,
        loginRequiredRedirect,
        setProfileComplete,
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
