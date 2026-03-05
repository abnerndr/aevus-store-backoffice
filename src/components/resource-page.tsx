"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { ZodTypeAny } from "zod"

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
import {
  useCreateResource,
  useDeleteResource,
  useResourceList,
  useUpdateResource,
} from "@/hooks/use-resource"
import { formatDate } from "@/lib/utils"

export interface FieldConfig {
  name: string
  label: string
  type?: "text" | "textarea" | "number" | "email"
  placeholder?: string
}

interface ResourcePageProps<T extends { id: string }> {
  title: string
  description: string
  resource: string
  fields: FieldConfig[]
  schema: ZodTypeAny
  extraColumns?: ColumnDef<T>[]
}

type SimpleFormValues = Record<string, string>

export function ResourcePage<
  T extends { id: string; name?: string; description?: string; createdAt?: string },
>({
  title,
  description,
  resource,
  fields,
  schema,
  extraColumns = [],
}: ResourcePageProps<T>) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const { data, isLoading } = useResourceList<T>(resource, {
    page,
    limit,
    ...(search ? { search } : {}),
  })

  const createMutation = useCreateResource<T, SimpleFormValues>(resource)
  const updateMutation = useUpdateResource<T, SimpleFormValues>(resource)
  const deleteMutation = useDeleteResource(resource)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<SimpleFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: fields.reduce(
      (acc, field) => ({ ...acc, [field.name]: "" }),
      {} as SimpleFormValues
    ),
  })

  function openCreate() {
    setSelectedItem(null)
    form.reset(
      fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {} as SimpleFormValues)
    )
    setDialogOpen(true)
  }

  function openEdit(item: T) {
    setSelectedItem(item)
    const values = fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: String((item as Record<string, unknown>)[field.name] ?? ""),
      }),
      {} as SimpleFormValues
    )
    form.reset(values)
    setDialogOpen(true)
  }

  function openDelete(item: T) {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  async function onSubmit(values: SimpleFormValues) {
    if (selectedItem) {
      await updateMutation.mutateAsync({ id: selectedItem.id, data: values })
    } else {
      await createMutation.mutateAsync(values)
    }
    setDialogOpen(false)
  }

  async function onDelete() {
    if (!selectedItem) return
    await deleteMutation.mutateAsync(selectedItem.id)
    setDeleteDialogOpen(false)
    setSelectedItem(null)
  }

  const defaultColumns: ColumnDef<T>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string | undefined
        return (
          <span className="text-muted-foreground text-sm truncate max-w-xs block">
            {desc || "—"}
          </span>
        )
      },
    },
    ...extraColumns,
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string | undefined
        return (
          <Badge variant="outline" className="text-xs font-normal">
            {date ? formatDate(date) : "—"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(row.original)}
            title="Editar"
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openDelete(row.original)}
            title="Excluir"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const isPending =
    createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Novo
        </Button>
      </div>

      <DataTable
        columns={defaultColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchPlaceholder={`Pesquisar ${title.toLowerCase()}...`}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        total={data?.total}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size)
          setPage(1)
        }}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Editar ${title.replace(/s$/, "")}` : `Novo ${title.replace(/s$/, "")}`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? "Atualize as informações do registro abaixo."
                : "Preencha as informações para criar um novo registro."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldConfig.label}</FormLabel>
                      <FormControl>
                        {fieldConfig.type === "textarea" ? (
                          <Textarea
                            placeholder={fieldConfig.placeholder}
                            rows={3}
                            {...field}
                            value={field.value as string}
                          />
                        ) : (
                          <Input
                            type={fieldConfig.type || "text"}
                            placeholder={fieldConfig.placeholder}
                            {...field}
                            value={field.value as string}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Salvando..."
                    : selectedItem
                      ? "Salvar alterações"
                      : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>&quot;{(selectedItem as Record<string, unknown>)?.name as string}&quot;</strong>? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
