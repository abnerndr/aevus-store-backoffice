"use client"

import { ImagePlus, Loader2, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { getAccessToken } from "@/lib/auth"

interface UploadedFile {
  url: string
  key: string
  originalName: string
}

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
}: ImageUploadProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      const remaining = maxFiles - value.length
      if (remaining <= 0) {
        toast.error(`Máximo de ${maxFiles} imagens permitidas`)
        return
      }

      const toUpload = fileArray.slice(0, remaining)
      if (fileArray.length > remaining) {
        toast.warning(`Apenas ${remaining} imagem(ns) podem ser adicionadas`)
      }

      const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      const invalid = toUpload.filter((f) => !ALLOWED.includes(f.type))
      if (invalid.length > 0) {
        toast.error("Apenas imagens jpeg, png, webp ou gif são permitidas")
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        toUpload.forEach((file) => formData.append("file", file))

        // Fallback: garante que o token seja enviado mesmo se o interceptor falhar
        const token = getAccessToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        // Não definir Content-Type: o browser define multipart/form-data com boundary automaticamente

        const { data } = await api.post<{ files: UploadedFile[] }>(
          "/api/uploads",
          formData,
          { headers: Object.keys(headers).length > 0 ? headers : undefined }
        )

        const newUrls = data.files.map((f) => f.url)
        onChange([...value, ...newUrls])
        toast.success(
          `${newUrls.length} imagem(ns) enviada(s) com sucesso!`
        )
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
        const status = axiosError?.response?.status
        const msg = axiosError?.response?.data?.message

        if (status === 401) {
          toast.error("Sessão expirada. Faça login novamente.")
          router.push("/auth/login")
        } else {
          toast.error(typeof msg === "string" ? msg : "Erro ao enviar imagem")
        }
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [value, onChange, maxFiles]
  )

  const removeImage = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled || uploading) return
      uploadFiles(e.dataTransfer.files)
    },
    [disabled, uploading, uploadFiles]
  )

  const canUpload = !disabled && !uploading && value.length < maxFiles

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (canUpload) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => canUpload && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-all",
          canUpload
            ? "cursor-pointer hover:border-primary/60 hover:bg-muted/40"
            : "cursor-not-allowed opacity-50",
          dragOver && "border-primary bg-primary/5 scale-[1.01]"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-7 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando...</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {dragOver
                  ? "Solte para enviar"
                  : "Clique ou arraste imagens aqui"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PNG, JPG, WEBP ou GIF · máx. 5 MB · até {maxFiles} imagens
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          disabled={!canUpload}
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files)
          }}
        />
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <Image
                src={url}
                alt={`Imagem ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(i)
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="size-3" />
                </Button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">img {i + 1}</p>
              </div>
            </div>
          ))}

          {/* Slot para adicionar mais */}
          {value.length < maxFiles && !uploading && !disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center hover:border-primary/60 hover:bg-muted/40 transition-all"
            >
              <ImagePlus className="size-5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} de {maxFiles} imagens
        </p>
      )}
    </div>
  )
}
