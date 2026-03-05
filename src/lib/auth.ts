import Cookies from "js-cookie"
import { api, clearAuthCookies, setAuthCookies } from "./api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  isVerified: boolean
  roles: Array<{ id: string; name: string; description?: string }>
  createdAt: string
  updatedAt: string
}

export async function login(credentials: LoginCredentials): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/api/auth/login", credentials)
  setAuthCookies(data.access_token, data.refresh_token, data.expires_in, data.refresh_expires_in)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout")
  } finally {
    clearAuthCookies()
  }
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>("/api/auth/me")
  return data
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token")
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token")
}
