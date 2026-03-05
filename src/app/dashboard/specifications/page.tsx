"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function SpecificationsPage() {
  return (
    <ResourcePage
      title="Especificações"
      description="Gerencie as especificações técnicas dos produtos"
      resource="specifications"
      schema={schema}
      fields={[
        {
          name: "name",
          label: "Nome da Especificação",
          placeholder: "Ex: Diâmetro da Caixa",
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descreva a especificação técnica",
        },
      ]}
    />
  )
}
