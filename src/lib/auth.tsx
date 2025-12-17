import { cookies } from "next/headers";

const TOKEN_AGE = 3600;
const TOKEN_NAME = "auth-token";
const TOKEN_REFRESH_NAME = "auth-refresh-token";

export function getToken(): string | undefined {
  const myAuthToken = cookies().get(TOKEN_NAME);
  return myAuthToken?.value;
}

export function getRefreshToken(): string | undefined {
  const myAuthToken = cookies().get(TOKEN_REFRESH_NAME);
  return myAuthToken?.value;
}

export function setToken(authToken: string): void {
  cookies().set({
    name: TOKEN_NAME,
    value: authToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: TOKEN_AGE,
  });
}

export function setRefreshToken(authRefreshToken: string): void {
  cookies().set({
    name: TOKEN_REFRESH_NAME,
    value: authRefreshToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: TOKEN_AGE,
  });
}

export function deleteTokens(): void {
  cookies().delete(TOKEN_REFRESH_NAME);
  cookies().delete(TOKEN_NAME);
}
