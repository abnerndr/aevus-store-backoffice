import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // FormData: remove Content-Type para o browser definir multipart/form-data com boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean
    }) | undefined

    // Só tenta refresh no cliente, com 401, com config válido e se não for retry
    const canRetry =
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry

    if (!canRetry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest!.headers.Authorization = `Bearer ${token}`
        return api(originalRequest!)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = Cookies.get("refresh_token")

    if (!refreshToken) {
      isRefreshing = false
      clearAuthCookies()
      return Promise.reject(error)
    }

    try {
      // Usa axios puro (sem interceptors) para evitar loop
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh`,
        { refreshToken },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: false,
        }
      )

      setAuthCookies(
        data.access_token,
        data.refresh_token,
        data.expires_in,
        data.refresh_expires_in
      )
      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
      processQueue(null, data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAuthCookies()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
  refreshExpiresIn?: number
) {
  const isSecure = process.env.NODE_ENV === "production"

  // expiresIn e refreshExpiresIn vêm em SEGUNDOS da API → converte para dias (js-cookie usa dias)
  const accessExpiresDays = expiresIn
    ? expiresIn / 60 / 60 / 24
    : 1 / 24 // fallback: 1 hora

  const refreshExpiresDays = refreshExpiresIn
    ? refreshExpiresIn / 60 / 60 / 24
    : 7 // fallback: 7 dias

  Cookies.set("access_token", accessToken, {
    expires: accessExpiresDays,
    sameSite: "lax",
    secure: isSecure,
  })
  Cookies.set("refresh_token", refreshToken, {
    expires: refreshExpiresDays,
    sameSite: "lax",
    secure: isSecure,
  })
}

export function clearAuthCookies() {
  Cookies.remove("access_token")
  Cookies.remove("refresh_token")
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: unknown
}
