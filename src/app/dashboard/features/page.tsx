"use client"

import { z } from "zod"
import { ResourcePage } from "@/components/resource-page"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

export default function FeaturesPage() {
  return (
    <ResourcePage
      title="Features"
      description="Gerencie as características e diferenciais dos produtos"
      resource="features"
      schema={schema}
      fields={[
        {
          name: "name",
          label: "Nome da Feature",
          placeholder: "Ex: À prova d'água",
        },
        {
          name: "description",
          label: "Descrição",
          type: "textarea",
          placeholder: "Descreva a característica",
        },
      ]}
    />
  )
}
