"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function SuppliersPage() {
  return (
    <ResourcePage
      title="Fornecedores"
      description="Gerencie os fornecedores de produtos"
      resource="suppliers"
      schema={schema}
      fields={[
        {
          name: "name",
          label: "Nome do Fornecedor",
          placeholder: "Ex: Distribuidor Premium",
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Informações sobre o fornecedor",
        },
      ]}
    />
  )
}
