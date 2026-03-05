"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function CategoriesPage() {
  return (
    <ResourcePage
      title="Categorias"
      description="Gerencie as categorias de produtos da loja"
      resource="categories"
      schema={schema}
      fields={[
        { name: "name", label: "Nome", placeholder: "Ex: Relógios Esportivos" },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descrição da categoria",
        },
      ]}
    />
  )
}
