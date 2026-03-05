"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getProfile, isAuthenticated, login, logout, type LoginCredentials } from "@/lib/auth"

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated(),
  })

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      toast.success("Login realizado com sucesso!")
      router.push("/dashboard")
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } }
      }
      const message =
        axiosError?.response?.data?.message || "Credenciais inválidas"
      toast.error(message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
      toast.success("Logout realizado com sucesso!")
      router.push("/auth/login")
    },
    onError: () => {
      queryClient.clear()
      router.push("/auth/login")
    },
  })

  return {
    user: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
