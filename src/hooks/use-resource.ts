"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { api, type PaginatedResponse, type QueryParams } from "@/lib/api"

export function useResourceList<T>(
  resource: string,
  params: QueryParams = {},
  responseKey?: string
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [resource, params],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>(
        `/api/${resource}`,
        { params }
      )
      // Se a API retorna { data: [], ... } (paginação padrão)
      if (Array.isArray(data.data)) {
        return data as unknown as PaginatedResponse<T>
      }
      // Se a API retorna { [key]: [], total } sem paginação
      const key = responseKey ?? resource
      const items = (data[key] as T[]) ?? []
      return {
        data: items,
        total: (data.total as number) ?? items.length,
        page: 1,
        limit: items.length,
        totalPages: 1,
      }
    },
  })
}

export function useResourceById<T>(resource: string, id: string | null) {
  return useQuery<T>({
    queryKey: [resource, id],
    enabled: !!id && typeof window !== "undefined",
    queryFn: async () => {
      const { data } = await api.get<T>(`/api/${resource}/${id}`)
      return data
    },
  })
}

export function useCreateResource<T, TInput>(resource: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TInput) => {
      const { data } = await api.post<T>(`/api/${resource}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      queryClient.invalidateQueries({ queryKey: ["stats", resource] })
      toast.success("Registro criado com sucesso!")
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } }
      }
      const msg = axiosError?.response?.data?.message
      const message = Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar registro"
      toast.error(message)
    },
  })
}

export function useUpdateResource<T, TInput>(resource: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TInput }) => {
      const { data: result } = await api.put<T>(`/api/${resource}/${id}`, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      toast.success("Registro atualizado com sucesso!")
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } }
      }
      const msg = axiosError?.response?.data?.message
      const message = Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao atualizar registro"
      toast.error(message)
    },
  })
}

export function useDeleteResource(resource: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/${resource}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      queryClient.invalidateQueries({ queryKey: ["stats", resource] })
      toast.success("Registro excluído com sucesso!")
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } }
      }
      const message =
        axiosError?.response?.data?.message || "Erro ao excluir registro"
      toast.error(message)
    },
  })
}
