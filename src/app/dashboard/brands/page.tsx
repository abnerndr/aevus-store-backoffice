"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function BrandsPage() {
  return (
    <ResourcePage
      title="Marcas"
      description="Gerencie as marcas de relógios cadastradas"
      resource="brands"
      schema={schema}
      fields={[
        { name: "name", label: "Nome da Marca", placeholder: "Ex: Rolex" },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descrição da marca",
        },
      ]}
    />
  )
}
