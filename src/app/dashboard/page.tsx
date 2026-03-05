"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Box,
  ClipboardList,
  Factory,
  Package,
  Shield,
  Tag,
  Truck,
  Users,
  Wrench,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

interface StatCardProps {
  title: string
  value: number | undefined
  isLoading: boolean
  icon: React.ElementType
  href: string
  description?: string
  color?: string
}

function StatCard({
  title,
  value,
  isLoading,
  icon: Icon,
  href,
  description,
  color = "bg-primary",
}: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tabular-nums">
                  {value?.toLocaleString("pt-BR") ?? "—"}
                </p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}
            >
              <Icon className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

async function fetchTotal(endpoint: string): Promise<number> {
  const { data } = await api.get(endpoint, { params: { limit: 1, page: 1 } })
  return data.total ?? 0
}

export default function DashboardPage() {
  const { user } = useAuth()

  const isClient = typeof window !== "undefined"

  const { data: productsTotal, isLoading: loadingProducts } = useQuery({
    queryKey: ["stats", "products"],
    queryFn: () => fetchTotal("/api/products"),
    enabled: isClient,
  })

  const { data: usersTotal, isLoading: loadingUsers } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: () => fetchTotal("/api/users"),
    enabled: isClient,
  })

  const { data: categoriesTotal, isLoading: loadingCategories } = useQuery({
    queryKey: ["stats", "categories"],
    queryFn: () => fetchTotal("/api/categories"),
    enabled: isClient,
  })

  const { data: brandsTotal, isLoading: loadingBrands } = useQuery({
    queryKey: ["stats", "brands"],
    queryFn: () => fetchTotal("/api/brands"),
    enabled: isClient,
  })

  const { data: featuresTotal, isLoading: loadingFeatures } = useQuery({
    queryKey: ["stats", "features"],
    queryFn: () => fetchTotal("/api/features"),
    enabled: isClient,
  })

  const { data: specificationsTotal, isLoading: loadingSpecifications } =
    useQuery({
      queryKey: ["stats", "specifications"],
      queryFn: () => fetchTotal("/api/specifications"),
      enabled: isClient,
    })

  const { data: factoriesTotal, isLoading: loadingFactories } = useQuery({
    queryKey: ["stats", "factories"],
    queryFn: () => fetchTotal("/api/factories"),
    enabled: isClient,
  })

  const { data: suppliersTotal, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["stats", "suppliers"],
    queryFn: () => fetchTotal("/api/suppliers"),
    enabled: isClient,
  })

  const { data: rolesTotal, isLoading: loadingRoles } = useQuery({
    queryKey: ["stats", "roles"],
    queryFn: () => fetchTotal("/api/roles"),
    enabled: isClient,
  })

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {user?.name?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao painel de controle da Watch Store
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <TrendingUp className="size-3" />
          Visão geral
        </Badge>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Catálogo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Produtos"
            value={productsTotal}
            isLoading={loadingProducts}
            icon={Package}
            href="/dashboard/products"
            description="Total de relógios cadastrados"
            color="bg-blue-500"
          />
          <StatCard
            title="Categorias"
            value={categoriesTotal}
            isLoading={loadingCategories}
            icon={Tag}
            href="/dashboard/categories"
            description="Categorias de produtos"
            color="bg-violet-500"
          />
          <StatCard
            title="Marcas"
            value={brandsTotal}
            isLoading={loadingBrands}
            icon={Box}
            href="/dashboard/brands"
            description="Marcas cadastradas"
            color="bg-amber-500"
          />
          <StatCard
            title="Features"
            value={featuresTotal}
            isLoading={loadingFeatures}
            icon={Wrench}
            href="/dashboard/features"
            description="Características de produtos"
            color="bg-green-500"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Especificações & Logística</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Especificações"
            value={specificationsTotal}
            isLoading={loadingSpecifications}
            icon={ClipboardList}
            href="/dashboard/specifications"
            description="Especificações técnicas"
            color="bg-teal-500"
          />
          <StatCard
            title="Fábricas"
            value={factoriesTotal}
            isLoading={loadingFactories}
            icon={Factory}
            href="/dashboard/factories"
            description="Fábricas parceiras"
            color="bg-orange-500"
          />
          <StatCard
            title="Fornecedores"
            value={suppliersTotal}
            isLoading={loadingSuppliers}
            icon={Truck}
            href="/dashboard/suppliers"
            description="Fornecedores cadastrados"
            color="bg-cyan-500"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Controle de Acesso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Usuários"
            value={usersTotal}
            isLoading={loadingUsers}
            icon={Users}
            href="/dashboard/users"
            description="Usuários registrados"
            color="bg-indigo-500"
          />
          <StatCard
            title="Funções"
            value={rolesTotal}
            isLoading={loadingRoles}
            icon={Shield}
            href="/dashboard/roles"
            description="Funções e permissões"
            color="bg-rose-500"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acesso Rápido</CardTitle>
          <CardDescription>
            Atalhos para as principais ações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/products", label: "Novo Produto", icon: Package },
              { href: "/dashboard/categories", label: "Nova Categoria", icon: Tag },
              { href: "/dashboard/brands", label: "Nova Marca", icon: Box },
              { href: "/dashboard/users", label: "Novo Usuário", icon: Users },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors text-center"
              >
                <item.icon className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
