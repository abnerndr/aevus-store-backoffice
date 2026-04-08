"use client"

import { ImagePlus, Loader2, Trash2, UploadCloud, X } from "lucide-react"
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

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

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
  const isSingleFile = maxFiles === 1

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

      const oversized = toUpload.filter((file) => file.size > MAX_FILE_SIZE_BYTES)
      if (oversized.length > 0) {
        toast.error(`Cada imagem deve ter no máximo ${MAX_FILE_SIZE_MB} MB`)
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
    [maxFiles, onChange, router, value]
  )

  const removeImage = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  const clearImages = () => {
    onChange([])
    if (inputRef.current) inputRef.current.value = ""
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

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled || uploading) return

      const files = Array.from(e.clipboardData.files)
      if (files.length === 0) return

      e.preventDefault()
      uploadFiles(files)
    },
    [disabled, uploading, uploadFiles]
  )

  const canUpload = !disabled && !uploading && value.length < maxFiles
  const remainingFiles = Math.max(maxFiles - value.length, 0)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight">
              {isSingleFile ? "Imagem principal" : "Galeria de imagens"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSingleFile
                ? "Envie uma imagem nítida para representar o item."
                : "Arraste, selecione ou cole imagens para montar a galeria do produto."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              {value.length}/{maxFiles} {isSingleFile ? "arquivo" : "imagens"}
            </span>
            {!disabled && value.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearImages}>
                <Trash2 className="size-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              if (canUpload) setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onPaste={onPaste}
            onClick={() => canUpload && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && canUpload) {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            tabIndex={canUpload ? 0 : -1}
            className={cn(
              "relative flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-8 text-center transition-all outline-none",
              canUpload
                ? "cursor-pointer border-border/80 bg-gradient-to-br from-background via-background to-muted/40 hover:border-primary/50 hover:bg-muted/35 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/40"
                : "cursor-not-allowed opacity-60",
              dragOver && "border-primary bg-primary/5 shadow-inner"
            )}
          >
            {uploading ? (
              <>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="size-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enviando imagens...</p>
                  <p className="text-xs text-muted-foreground">
                    Mantenha esta janela aberta at&#233; a conclus&#227;o do envio.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
                  {dragOver ? (
                    <UploadCloud className="size-8" />
                  ) : (
                    <ImagePlus className="size-8" />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-tight">
                    {dragOver
                      ? "Solte as imagens para enviar"
                      : isSingleFile
                        ? "Clique, arraste ou cole uma imagem aqui"
                        : "Clique, arraste ou cole imagens aqui"}
                  </p>
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                    JPG, PNG, WEBP ou GIF com at&#233; {MAX_FILE_SIZE_MB} MB cada.
                    {remainingFiles > 0
                      ? ` Ainda cabem ${remainingFiles} ${remainingFiles === 1 ? "arquivo" : "arquivos"}.`
                      : " O limite da galeria foi atingido."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.click()
                    }}
                    disabled={!canUpload}
                  >
                    <ImagePlus className="size-4" />
                    Selecionar {isSingleFile ? "imagem" : "arquivos"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Ctrl/Cmd + V tamb&#233;m funciona
                  </span>
                </div>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple={!isSingleFile}
              className="sr-only"
              disabled={!canUpload}
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files)
              }}
            />
          </div>

          {value.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {value.map((url, i) => (
                <div
                  key={url + i}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm"
                >
                  <Image
                    src={url}
                    alt={`Imagem ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    unoptimized
                  />

                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                    <span className="rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                      {isSingleFile ? "Principal" : `#${i + 1}`}
                    </span>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(i)
                        }}
                        className="shadow-md"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 py-2">
                    <p className="truncate text-xs text-white">
                      {isSingleFile ? "Imagem pronta para exibi&#231;&#227;o" : `Imagem ${i + 1} da galeria`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              {value.length === 0
                ? isSingleFile
                  ? "Nenhuma imagem enviada ainda."
                  : "Nenhuma imagem enviada ainda. Comece montando a galeria."
                : isSingleFile
                  ? "Imagem carregada com sucesso. Voc&#234; pode substitu&#237;-la a qualquer momento."
                  : `${value.length} imagem(ns) pronta(s) para o cadastro.`}
            </p>

            {canUpload && value.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 self-start"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Adicionar mais
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
