"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { ImageUpload } from "@/components/image-upload";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource } from "@/hooks/use-resource";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
	id: string;
	name: string;
	model: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	description?: string;
	price: number;
	stock: number;
	images: string[];
	watchType: string;
	caseMaterial?: string;
	caseDiameter?: string;
	crystalMaterial?: string;
	strapMaterial?: string;
	movement: string;
	useCase: string;
	isFeatured?: boolean;
	isNew?: boolean;
	isBestSeller?: boolean;
	brand?: { id: string; name: string };
	categories?: { id: string; name: string }[];
	features?: { id: string; name: string }[];
	specifications?: { id: string; name: string }[];
	createdAt: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	model: z.string().min(1, "Modelo é obrigatório"),
	description: z.string().optional(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
	price: z.string().min(1, "Preço é obrigatório"),
	stock: z.string().min(1, "Estoque é obrigatório"),
	watchType: z.enum(["AAA_PLUS", "SUPER_CLONE"]),
	caseMaterial: z.string().min(1, "Material da caixa é obrigatório"),
	caseDiameter: z.string().min(1, "Diâmetro é obrigatório"),
	crystalMaterial: z.string().min(1, "Material do cristal é obrigatório"),
	strapMaterial: z.string().min(1, "Material da pulseira é obrigatório"),
	movement: z.enum(["MIYOTA", "CITIZEN", "BASE_ETA", "ETA"]),
	useCase: z.enum(["FORMAL", "CASUAL", "SPORT"]),
	brandId: z.string().min(1, "Marca é obrigatória"),
	categoryIds: z.array(z.string()).optional(),
	featureIds: z.array(z.string()).optional(),
	specificationIds: z.array(z.string()).optional(),
	images: z.array(z.string()).optional(),
	isFeatured: z.boolean().optional(),
	isNew: z.boolean().optional(),
	isBestSeller: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;
type ProductPayload = Omit<ProductFormValues, "price" | "stock"> & {
	price: number;
	stock: number;
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
	PUBLISHED: { label: "Publicado", variant: "default" },
	DRAFT: { label: "Rascunho", variant: "secondary" },
	ARCHIVED: { label: "Arquivado", variant: "outline" },
};

const MOVEMENT_LABELS: Record<string, string> = {
	MIYOTA: "Miyota",
	CITIZEN: "Citizen",
	BASE_ETA: "Base ETA",
	ETA: "ETA",
};

const USECASE_LABELS: Record<string, string> = {
	FORMAL: "Formal",
	CASUAL: "Casual",
	SPORT: "Esportivo",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	const { data, isLoading } = useResourceList<Product>("products", {
		page,
		limit,
		...(search ? { search } : {}),
	});

	const { data: brandsData } = useResourceList<{ id: string; name: string }>("brands", { limit: 100 });
	const { data: categoriesData } = useResourceList<{ id: string; name: string }>("categories", { limit: 100 });
	const { data: featuresData } = useResourceList<{ id: string; name: string }>("features", { limit: 100 });
	const { data: specificationsData } = useResourceList<{ id: string; name: string }>("specifications", { limit: 100 });

	const createMutation = useCreateResource<Product, ProductPayload>("products");
	const updateMutation = useUpdateResource<Product, Partial<ProductPayload>>("products");
	const deleteMutation = useDeleteResource("products");

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			name: "",
			model: "",
			description: "",
			status: "DRAFT",
			price: "",
			stock: "",
			watchType: "SUPER_CLONE",
			caseMaterial: "",
			caseDiameter: "",
			crystalMaterial: "",
			strapMaterial: "",
			movement: "MIYOTA",
			useCase: "CASUAL",
			brandId: "",
			categoryIds: [],
			featureIds: [],
			specificationIds: [],
			images: [],
			isFeatured: false,
			isNew: false,
			isBestSeller: false,
		},
	});

	function openCreate() {
		setSelectedProduct(null);
		form.reset({
			name: "",
			model: "",
			description: "",
			status: "DRAFT",
			price: "",
			stock: "",
			watchType: "SUPER_CLONE",
			caseMaterial: "",
			caseDiameter: "",
			crystalMaterial: "",
			strapMaterial: "",
			movement: "MIYOTA",
			useCase: "CASUAL",
			brandId: "",
			categoryIds: [],
			featureIds: [],
			specificationIds: [],
			images: [],
			isFeatured: false,
			isNew: false,
			isBestSeller: false,
		});
		setDialogOpen(true);
	}

	function openEdit(product: Product) {
		setSelectedProduct(product);
		form.reset({
			name: product.name,
			model: product.model,
			description: product.description ?? "",
			status: product.status,
			price: String(product.price),
			stock: String(product.stock),
			watchType: product.watchType as ProductFormValues["watchType"],
			caseMaterial: product.caseMaterial ?? "",
			caseDiameter: product.caseDiameter ?? "",
			crystalMaterial: product.crystalMaterial ?? "",
			strapMaterial: product.strapMaterial ?? "",
			movement: product.movement as ProductFormValues["movement"],
			useCase: product.useCase as ProductFormValues["useCase"],
			brandId: product.brand?.id ?? "",
			categoryIds: product.categories?.map((c) => c.id) ?? [],
			featureIds: product.features?.map((f) => f.id) ?? [],
			specificationIds: product.specifications?.map((s) => s.id) ?? [],
			images: product.images ?? [],
			isFeatured: product.isFeatured ?? false,
			isNew: product.isNew ?? false,
			isBestSeller: product.isBestSeller ?? false,
		});
		setDialogOpen(true);
	}

	async function onSubmit(values: ProductFormValues) {
		const payload: ProductPayload = {
			...values,
			price: parseFloat(values.price),
			stock: parseInt(values.stock, 10),
		};
		if (selectedProduct) {
			await updateMutation.mutateAsync({ id: selectedProduct.id, data: payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		setDialogOpen(false);
	}

	// ─── Columns ──────────────────────────────────────────────────────────────

	const columns: ColumnDef<Product>[] = [
		{
			id: "product",
			header: "Produto",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					{row.original.images?.[0] ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={row.original.images[0]}
							alt={row.original.name}
							className="w-10 h-10 rounded-md object-cover border shrink-0"
						/>
					) : (
						<div className="w-10 h-10 rounded-md bg-muted border shrink-0 flex items-center justify-center text-muted-foreground text-xs">
							—
						</div>
					)}
					<div>
						<p className="font-medium text-sm">{row.original.name}</p>
						<p className="text-xs text-muted-foreground">{row.original.model}</p>
					</div>
				</div>
			),
		},
		{
			accessorKey: "brand",
			header: "Marca",
			cell: ({ row }) => <span className="text-sm">{row.original.brand?.name ?? "—"}</span>,
		},
		{
			accessorKey: "price",
			header: "Preço",
			cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.original.price)}</span>,
		},
		{
			accessorKey: "stock",
			header: "Estoque",
			cell: ({ row }) => (
				<Badge variant={row.original.stock > 0 ? "outline" : "destructive"} className="tabular-nums">
					{row.original.stock}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const s = STATUS_LABELS[row.original.status] ?? {
					label: row.original.status,
					variant: "outline" as const,
				};
				return <Badge variant={s.variant}>{s.label}</Badge>;
			},
		},
		{
			accessorKey: "movement",
			header: "Movimento",
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{MOVEMENT_LABELS[row.original.movement] ?? row.original.movement}
				</span>
			),
		},
		{
			accessorKey: "useCase",
			header: "Uso",
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{USECASE_LABELS[row.original.useCase] ?? row.original.useCase}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Criado em",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
		},
		{
			id: "actions",
			header: "Ações",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)}>
						<Edit className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							setSelectedProduct(row.original);
							setDeleteDialogOpen(true);
						}}
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			),
		},
	];

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
					<p className="text-muted-foreground mt-1">Gerencie o catálogo de relógios da loja</p>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="size-4" />
					Novo Produto
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				isLoading={isLoading}
				searchPlaceholder="Pesquisar produtos..."
				onSearchChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				total={data?.total}
				currentPage={page}
				totalPages={data?.totalPages ?? 1}
				pageSize={limit}
				onPageChange={setPage}
				onPageSizeChange={(size) => {
					setLimit(size);
					setPage(1);
				}}
			/>

			{/* ── Form Dialog ─────────────────────────────────────────────────────── */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-2xl !flex flex-col gap-0 p-0 h-[88vh] overflow-hidden">
					<DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
						<DialogTitle>{selectedProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
						<DialogDescription>Preencha as informações do relógio abaixo.</DialogDescription>
					</DialogHeader>

					<ScrollArea className="flex-1 overflow-hidden">
						<div className="px-6 py-4">
							<Form {...form}>
								<form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
									{/* Identificação */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Nome *</FormLabel>
													<FormControl>
														<Input placeholder="Submariner Date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="model"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Modelo *</FormLabel>
													<FormControl>
														<Input placeholder="116610LN" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Descrição</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Descrição detalhada do produto..."
														className="resize-none"
														rows={3}
														{...field}
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Preço / Estoque / Status */}
									<div className="grid grid-cols-3 gap-4">
										<FormField
											control={form.control}
											name="price"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Preço (R$) *</FormLabel>
													<FormControl>
														<Input type="number" step="0.01" placeholder="350.00" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="stock"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Estoque *</FormLabel>
													<FormControl>
														<Input type="number" placeholder="10" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Status</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="DRAFT">Rascunho</SelectItem>
															<SelectItem value="PUBLISHED">Publicado</SelectItem>
															<SelectItem value="ARCHIVED">Arquivado</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Marca / Tipo */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="brandId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Marca *</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Selecione a marca" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{brandsData?.data?.map((brand) => (
																<SelectItem key={brand.id} value={brand.id}>
																	{brand.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="watchType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Tipo *</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="AAA_PLUS">AAA+</SelectItem>
															<SelectItem value="SUPER_CLONE">Super Clone</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* Categorias, Features, Especificações */}
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										<FormField
											control={form.control}
											name="categoryIds"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<MultiSelect
															label="Categorias"
															options={categoriesData?.data ?? []}
															value={field.value ?? []}
															onChange={field.onChange}
															placeholder="Selecione categorias"
															disabled={createMutation.isPending || updateMutation.isPending}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="featureIds"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<MultiSelect
															label="Features"
															options={featuresData?.data ?? []}
															value={field.value ?? []}
															onChange={field.onChange}
															placeholder="Selecione features"
															disabled={createMutation.isPending || updateMutation.isPending}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="specificationIds"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<MultiSelect
															label="Especificações"
															options={specificationsData?.data ?? []}
															value={field.value ?? []}
															onChange={field.onChange}
															placeholder="Selecione especificações"
															disabled={createMutation.isPending || updateMutation.isPending}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<Separator />
									<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Especificações Técnicas
									</p>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="caseMaterial"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Material da Caixa *</FormLabel>
													<FormControl>
														<Input placeholder="316L Stainless Steel" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="caseDiameter"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Diâmetro *</FormLabel>
													<FormControl>
														<Input placeholder="40mm" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="crystalMaterial"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Material do Cristal *</FormLabel>
													<FormControl>
														<Input placeholder="Sapphire" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="strapMaterial"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Material da Pulseira *</FormLabel>
													<FormControl>
														<Input placeholder="Oyster Bracelet Steel" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="movement"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Movimento *</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="MIYOTA">Miyota</SelectItem>
															<SelectItem value="CITIZEN">Citizen</SelectItem>
															<SelectItem value="BASE_ETA">Base ETA</SelectItem>
															<SelectItem value="ETA">ETA</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="useCase"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Uso *</FormLabel>
													<Select value={field.value} onValueChange={field.onChange}>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="FORMAL">Formal</SelectItem>
															<SelectItem value="CASUAL">Casual</SelectItem>
															<SelectItem value="SPORT">Esportivo</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<Separator />
									<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Imagens do Produto
									</p>

									{/* Image upload controller */}
									<Controller
										control={form.control}
										name="images"
										render={({ field }) => (
											<ImageUpload
												value={field.value ?? []}
												onChange={field.onChange}
												maxFiles={5}
												disabled={createMutation.isPending || updateMutation.isPending}
											/>
										)}
									/>
								</form>
							</Form>
						</div>
					</ScrollArea>

					<DialogFooter className="shrink-0 px-6 py-4 border-t bg-background">
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancelar
						</Button>
						<Button type="submit" form="product-form" disabled={createMutation.isPending || updateMutation.isPending}>
							{createMutation.isPending || updateMutation.isPending
								? "Salvando..."
								: selectedProduct
									? "Salvar alterações"
									: "Criar produto"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Delete Dialog ───────────────────────────────────────────────────── */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Confirmar exclusão</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir <strong>&quot;{selectedProduct?.name}&quot;</strong>? Esta ação não pode
							ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={async () => {
								if (!selectedProduct) return;
								await deleteMutation.mutateAsync(selectedProduct.id);
								setDeleteDialogOpen(false);
							}}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Excluindo..." : "Excluir"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
