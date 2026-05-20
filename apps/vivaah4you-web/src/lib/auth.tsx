import { cookies } from "next/headers";

const TOKEN_AGE = 3600;
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
    maxAge: TOKEN_AGE,
  });
}

export async function deleteTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_REFRESH_NAME);
  cookieStore.delete(TOKEN_NAME);
}
