"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function FactoriesPage() {
  return (
    <ResourcePage
      title="Fábricas"
      description="Gerencie as fábricas parceiras"
      resource="factories"
      schema={schema}
      fields={[
        {
          name: "name",
          label: "Nome da Fábrica",
          placeholder: "Ex: ARF Factory",
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Informações sobre a fábrica",
        },
      ]}
    />
  )
}
