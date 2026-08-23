import { cookies } from "next/headers";

// Kept in sync with NINJA_JWT lifetimes in services/vivaah4u-api/vivaah4you/settings.py.
const TOKEN_AGE = 60 * 60;            // access token: 1 hour
const REFRESH_TOKEN_AGE = 60 * 60 * 24 * 7;  // refresh token: 7 days
const TOKEN_NAME = "auth-token";
const TOKEN_REFRESH_NAME = "auth-refresh-token";

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const myAuthToken = cookieStore.get(TOKEN_NAME);
  return myAuthToken?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const myAuthToken = cookieStore.get(TOKEN_REFRESH_NAME);
  return myAuthToken?.value;
}

export async function setToken(authToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: TOKEN_NAME,
    value: authToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: TOKEN_AGE,
  });
}

export async function setRefreshToken(authRefreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: TOKEN_REFRESH_NAME,
    value: authRefreshToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: REFRESH_TOKEN_AGE,
  });
}

export async function deleteTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_REFRESH_NAME);
  cookieStore.delete(TOKEN_NAME);
}
