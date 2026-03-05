"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Shield, Lock, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  createdAt: string
}

interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  createdAt: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

const permissionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  resource: z.string().min(1, "Recurso é obrigatório"),
  action: z.string().min(1, "Ação é obrigatória"),
  description: z.string().optional(),
})

type RoleFormValues = z.infer<typeof roleSchema>
type PermissionFormValues = z.infer<typeof permissionSchema>

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const { data } = await api.get<{ roles: Role[]; total: number }>(
        "/api/roles"
      )
      return data
    },
  })
}

function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const { data } = await api.get<{
        permissions: Permission[]
        total: number
      }>("/api/roles/permissions")
      return data
    },
  })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "roles" | "permissions"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("roles")
  const queryClient = useQueryClient()

  // Roles state
  const [roleDialog, setRoleDialog] = useState(false)
  const [deleteRoleDialog, setDeleteRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Permissions state
  const [permDialog, setPermDialog] = useState(false)
  const [deletePermDialog, setDeletePermDialog] = useState(false)
  const [selectedPerm, setSelectedPerm] = useState<Permission | null>(null)

  const [roleSearch, setRoleSearch] = useState("")
  const [permSearch, setPermSearch] = useState("")

  const rolesQuery = useRoles()
  const permissionsQuery = usePermissions()

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  })

  const permForm = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { name: "", resource: "", action: "", description: "" },
  })

  // ─── Role mutations ─────────────────────────────────────────────────────────

  const createRole = useMutation({
    mutationFn: (values: RoleFormValues) => api.post("/api/roles", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Função criada com sucesso!")
      setRoleDialog(false)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg || "Erro ao criar função")
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleFormValues }) =>
      api.put(`/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Função atualizada com sucesso!")
      setRoleDialog(false)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg || "Erro ao atualizar função")
    },
  })

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Função excluída com sucesso!")
      setDeleteRoleDialog(false)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg || "Erro ao excluir função")
    },
  })

  // ─── Permission mutations ────────────────────────────────────────────────────

  const createPerm = useMutation({
    mutationFn: (values: PermissionFormValues) =>
      api.post("/api/roles/permissions", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
      toast.success("Permissão criada com sucesso!")
      setPermDialog(false)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg || "Erro ao criar permissão")
    },
  })

  const deletePerm = useMutation({
    mutationFn: (id: string) => api.delete(`/api/roles/permissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
      toast.success("Permissão excluída com sucesso!")
      setDeletePermDialog(false)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg || "Erro ao excluir permissão")
    },
  })

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openCreateRole() {
    setSelectedRole(null)
    roleForm.reset({ name: "", description: "" })
    setRoleDialog(true)
  }

  function openEditRole(role: Role) {
    setSelectedRole(role)
    roleForm.reset({ name: role.name, description: role.description ?? "" })
    setRoleDialog(true)
  }

  async function onRoleSubmit(values: RoleFormValues) {
    if (selectedRole) {
      await updateRole.mutateAsync({ id: selectedRole.id, data: values })
    } else {
      await createRole.mutateAsync(values)
    }
  }

  async function onPermSubmit(values: PermissionFormValues) {
    await createPerm.mutateAsync(values)
  }

  // ─── Filtered data ───────────────────────────────────────────────────────────

  const roles = (rolesQuery.data?.roles ?? []).filter(
    (r) =>
      !roleSearch ||
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.description?.toLowerCase().includes(roleSearch.toLowerCase())
  )

  const permissions = (permissionsQuery.data?.permissions ?? []).filter(
    (p) =>
      !permSearch ||
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.resource.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.action.toLowerCase().includes(permSearch.toLowerCase())
  )

  // ─── Columns ────────────────────────────────────────────────────────────────

  const roleColumns: ColumnDef<Role>[] = [
    {
      id: "role",
      header: "Função",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-900/30 shrink-0">
            <Shield className="size-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-muted-foreground">
                {row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "permissions",
      header: "Permissões",
      cell: ({ row }) => {
        const perms = row.original.permissions
        if (!perms?.length)
          return (
            <span className="text-muted-foreground text-sm">Nenhuma</span>
          )
        return (
          <div className="flex flex-wrap gap-1 max-w-sm">
            {perms.slice(0, 4).map((p) => (
              <Badge key={p.id} variant="outline" className="text-xs font-normal">
                {p.resource}:{p.action}
              </Badge>
            ))}
            {perms.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{perms.length - 4}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEditRole(row.original)}
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelectedRole(row.original)
              setDeleteRoleDialog(true)
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const permColumns: ColumnDef<Permission>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Lock className="size-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-sm">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "resource",
      header: "Recurso",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-mono">
          {row.original.resource}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-mono">
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setSelectedPerm(row.original)
            setDeletePermDialog(true)
          }}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Funções & Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os níveis de acesso e permissões do sistema
          </p>
        </div>
        <Button
          onClick={activeTab === "roles" ? openCreateRole : () => { permForm.reset(); setPermDialog(true) }}
          className="gap-2"
        >
          <Plus className="size-4" />
          {activeTab === "roles" ? "Nova Função" : "Nova Permissão"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["roles", "permissions"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "roles" ? (
              <Shield className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
            {tab === "roles" ? "Funções" : "Permissões"}
            <Badge variant="secondary" className="text-xs ml-1">
              {tab === "roles"
                ? (rolesQuery.data?.total ?? 0)
                : (permissionsQuery.data?.total ?? 0)}
            </Badge>
          </button>
        ))}
      </div>

      <Separator className="-mt-4" />

      {/* Roles tab */}
      {activeTab === "roles" && (
        <DataTable
          columns={roleColumns}
          data={roles}
          isLoading={rolesQuery.isLoading}
          searchPlaceholder="Pesquisar funções..."
          onSearchChange={setRoleSearch}
          total={rolesQuery.data?.total ?? 0}
          currentPage={1}
          totalPages={1}
          pageSize={roles.length || 10}
        />
      )}

      {/* Permissions tab */}
      {activeTab === "permissions" && (
        <DataTable
          columns={permColumns}
          data={permissions}
          isLoading={permissionsQuery.isLoading}
          searchPlaceholder="Pesquisar permissões (recurso, ação)..."
          onSearchChange={setPermSearch}
          total={permissionsQuery.data?.total ?? 0}
          currentPage={1}
          totalPages={1}
          pageSize={permissions.length || 10}
        />
      )}

      {/* Role create/edit dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Editar Função" : "Nova Função"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole
                ? "Atualize o nome e a descrição da função."
                : "Crie uma nova função de acesso ao sistema."}
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form
              onSubmit={roleForm.handleSubmit(onRoleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={roleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Função</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ADMIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da função"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createRole.isPending || updateRole.isPending}
                >
                  {createRole.isPending || updateRole.isPending
                    ? "Salvando..."
                    : selectedRole
                      ? "Salvar"
                      : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permission create dialog */}
      <Dialog open={permDialog} onOpenChange={setPermDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Permissão</DialogTitle>
            <DialogDescription>
              Crie uma nova permissão para associar às funções.
            </DialogDescription>
          </DialogHeader>
          <Form {...permForm}>
            <form
              onSubmit={permForm.handleSubmit(onPermSubmit)}
              className="space-y-4"
            >
              <FormField
                control={permForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: create:products" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={permForm.control}
                  name="resource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurso</FormLabel>
                      <FormControl>
                        <Input placeholder="products" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={permForm.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ação</FormLabel>
                      <FormControl>
                        <Input placeholder="create" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={permForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da permissão"
                        rows={2}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPermDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createPerm.isPending}>
                  {createPerm.isPending ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete role dialog */}
      <Dialog open={deleteRoleDialog} onOpenChange={setDeleteRoleDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a função{" "}
              <strong>&quot;{selectedRole?.name}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRoleDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRole && deleteRole.mutate(selectedRole.id)}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete permission dialog */}
      <Dialog open={deletePermDialog} onOpenChange={setDeletePermDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a permissão{" "}
              <strong>&quot;{selectedPerm?.name}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePermDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPerm && deletePerm.mutate(selectedPerm.id)}
              disabled={deletePerm.isPending}
            >
              {deletePerm.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
