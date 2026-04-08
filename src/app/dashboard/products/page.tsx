"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { ImageUpload } from "@/components/image-upload";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource } from "@/hooks/use-resource";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RelationItem {
	id: string;
	name: string;
}

interface ProductOptionalItem {
	id: string;
	title: string;
	description?: string;
	price: number;
	oldPrice?: number;
	image?: string;
}

interface ProductInstallmentOption {
	id: string;
	label?: string;
	installments: number;
	installmentAmount: number;
	totalAmount: number;
	feePercentage?: number;
}

interface ProductReview {
	id: string;
	authorName: string;
	rating: number;
	title?: string;
	comment?: string;
	createdAt: string;
}

interface Product {
	id: string;
	name: string;
	model: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	description?: string;
	price: number;
	cashPrice?: number;
	stock: number;
	images: string[];
	tags: string[];
	watchType: "AAA_PLUS" | "SUPER_CLONE";
	caseMaterial: string;
	caseDiameter: string;
	crystalMaterial: string;
	strapMaterial: string;
	movement: "MIYOTA" | "CITIZEN" | "BASE_ETA" | "ETA";
	useCase: "FORMAL" | "CASUAL" | "SPORT";
	isFeatured: boolean;
	isNew: boolean;
	isBestSeller: boolean;
	isTopRated: boolean;
	isDiscounted: boolean;
	discountPercentage?: number;
	purchaseNotes?: string;
	averageRating?: number;
	reviewCount: number;
	infinitePayId?: string;
	infinitePayHandle?: string;
	infinitePayDescription?: string;
	optionalItems: ProductOptionalItem[];
	installmentOptions: ProductInstallmentOption[];
	reviews: ProductReview[];
	brand?: RelationItem;
	categories: RelationItem[];
	features: RelationItem[];
	specifications: RelationItem[];
	factories: RelationItem[];
	suppliers: RelationItem[];
	createdAt: string;
}

const optionalItemSchema = z.object({
	title: z.string().min(1, "Título é obrigatório"),
	description: z.string().optional(),
	price: z.string().min(1, "Preço é obrigatório"),
	oldPrice: z.string().optional(),
	image: z.string().optional(),
});

const installmentOptionSchema = z.object({
	label: z.string().optional(),
	installments: z.string().min(1, "Informe o número de parcelas"),
	installmentAmount: z.string().min(1, "Informe o valor da parcela"),
	totalAmount: z.string().min(1, "Informe o valor total"),
	feePercentage: z.string().optional(),
});

const reviewSchema = z.object({
	authorName: z.string().min(1, "Autor é obrigatório"),
	rating: z.string().min(1, "Nota é obrigatória"),
	title: z.string().optional(),
	comment: z.string().optional(),
});

const productSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	model: z.string().min(1, "Modelo é obrigatório"),
	description: z.string().optional(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
	price: z.string().min(1, "Preço é obrigatório"),
	cashPrice: z.string().optional(),
	stock: z.string().min(1, "Estoque é obrigatório"),
	images: z.array(z.string()).default([]),
	tags: z.array(z.string()).default([]),
	watchType: z.enum(["AAA_PLUS", "SUPER_CLONE"]),
	caseMaterial: z.string().min(1, "Material da caixa é obrigatório"),
	caseDiameter: z.string().min(1, "Diâmetro é obrigatório"),
	crystalMaterial: z.string().min(1, "Material do cristal é obrigatório"),
	strapMaterial: z.string().min(1, "Material da pulseira é obrigatório"),
	movement: z.enum(["MIYOTA", "CITIZEN", "BASE_ETA", "ETA"]),
	useCase: z.enum(["FORMAL", "CASUAL", "SPORT"]),
	brandId: z.string().min(1, "Marca é obrigatória"),
	categoryIds: z.array(z.string()).default([]),
	featureIds: z.array(z.string()).default([]),
	specificationIds: z.array(z.string()).default([]),
	factoryIds: z.array(z.string()).default([]),
	supplierIds: z.array(z.string()).default([]),
	isFeatured: z.boolean().default(false),
	isNew: z.boolean().default(false),
	isBestSeller: z.boolean().default(false),
	isTopRated: z.boolean().default(false),
	isDiscounted: z.boolean().default(false),
	discountPercentage: z.string().optional(),
	purchaseNotes: z.string().optional(),
	infinitePayId: z.string().optional(),
	infinitePayHandle: z.string().optional(),
	infinitePayDescription: z.string().optional(),
	optionalItems: z.array(optionalItemSchema).default([]),
	installmentOptions: z.array(installmentOptionSchema).default([]),
	reviews: z.array(reviewSchema).default([]),
});

type ProductFormValues = z.input<typeof productSchema>;

type ProductPayload = {
	name: string;
	model: string;
	description?: string;
	status: Product["status"];
	price: number;
	cashPrice?: number;
	stock: number;
	images: string[];
	tags: string[];
	watchType: Product["watchType"];
	caseMaterial: string;
	caseDiameter: string;
	crystalMaterial: string;
	strapMaterial: string;
	movement: Product["movement"];
	useCase: Product["useCase"];
	brandId: string;
	categoryIds: string[];
	featureIds: string[];
	specificationIds: string[];
	factoryIds: string[];
	supplierIds: string[];
	isFeatured: boolean;
	isNew: boolean;
	isBestSeller: boolean;
	isTopRated: boolean;
	isDiscounted: boolean;
	discountPercentage?: number;
	purchaseNotes?: string;
	infinitePayId?: string;
	infinitePayHandle?: string;
	infinitePayDescription?: string;
	optionalItems: Array<{
		title: string;
		description?: string;
		price: number;
		oldPrice?: number;
		image?: string;
	}>;
	installmentOptions: Array<{
		label?: string;
		installments: number;
		installmentAmount: number;
		totalAmount: number;
		feePercentage?: number;
	}>;
	reviews: Array<{
		authorName: string;
		rating: number;
		title?: string;
		comment?: string;
	}>;
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
	PUBLISHED: { label: "Publicado", variant: "default" },
	DRAFT: { label: "Rascunho", variant: "secondary" },
	ARCHIVED: { label: "Arquivado", variant: "outline" },
};

const WATCH_TYPE_LABELS: Record<string, string> = {
	AAA_PLUS: "AAA+",
	SUPER_CLONE: "Super Clone",
};

const PRODUCT_MODAL_SECTIONS = [
	{ id: "identificacao", label: "Identificação" },
	{ id: "comercial", label: "Comercial" },
	{ id: "checkout", label: "InfinitePay" },
	{ id: "especificacoes", label: "Especificações" },
	{ id: "relacionamentos", label: "Relacionamentos" },
	{ id: "imagens", label: "Imagens" },
	{ id: "parcelamentos", label: "Parcelamentos" },
	{ id: "opcionais", label: "Itens opcionais" },
	{ id: "avaliacoes", label: "Avaliações" },
] as const;

const emptyOptionalItem = () => ({
	title: "",
	description: "",
	price: "",
	oldPrice: "",
	image: "",
});

const emptyInstallmentOption = () => ({
	label: "",
	installments: "",
	installmentAmount: "",
	totalAmount: "",
	feePercentage: "",
});

const emptyReview = () => ({
	authorName: "",
	rating: "5",
	title: "",
	comment: "",
});

function parseOptionalNumber(value?: string) {
	if (!value || value.trim() === "") return undefined;
	return Number.parseFloat(value);
}

export default function ProductsPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const modalBodyRef = useRef<HTMLDivElement | null>(null);

	const { data, isLoading } = useResourceList<Product>("products", {
		page,
		limit,
		...(search ? { search } : {}),
	});

	const { data: brandsData } = useResourceList<RelationItem>("brands", { limit: 100 });
	const { data: categoriesData } = useResourceList<RelationItem>("categories", { limit: 100 });
	const { data: featuresData } = useResourceList<RelationItem>("features", { limit: 100 });
	const { data: specificationsData } = useResourceList<RelationItem>("specifications", { limit: 100 });
	const { data: factoriesData } = useResourceList<RelationItem>("factories", { limit: 100 });
	const { data: suppliersData } = useResourceList<RelationItem>("suppliers", { limit: 100 });

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
			cashPrice: "",
			stock: "",
			images: [],
			tags: [],
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
			factoryIds: [],
			supplierIds: [],
			isFeatured: false,
			isNew: false,
			isBestSeller: false,
			isTopRated: false,
			isDiscounted: false,
			discountPercentage: "",
			purchaseNotes: "",
			infinitePayId: "",
			infinitePayHandle: "",
			infinitePayDescription: "",
			optionalItems: [],
			installmentOptions: [],
			reviews: [],
		},
	});

	const optionalItemsArray = useFieldArray({
		control: form.control,
		name: "optionalItems",
	});

	const installmentOptionsArray = useFieldArray({
		control: form.control,
		name: "installmentOptions",
	});

	const reviewsArray = useFieldArray({
		control: form.control,
		name: "reviews",
	});

	function resetForm() {
		form.reset({
			name: "",
			model: "",
			description: "",
			status: "DRAFT",
			price: "",
			cashPrice: "",
			stock: "",
			images: [],
			tags: [],
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
			factoryIds: [],
			supplierIds: [],
			isFeatured: false,
			isNew: false,
			isBestSeller: false,
			isTopRated: false,
			isDiscounted: false,
			discountPercentage: "",
			purchaseNotes: "",
			infinitePayId: "",
			infinitePayHandle: "",
			infinitePayDescription: "",
			optionalItems: [],
			installmentOptions: [],
			reviews: [],
		});
	}

	function openCreate() {
		setSelectedProduct(null);
		resetForm();
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
			cashPrice: product.cashPrice ? String(product.cashPrice) : "",
			stock: String(product.stock),
			images: product.images ?? [],
			tags: product.tags ?? [],
			watchType: product.watchType,
			caseMaterial: product.caseMaterial,
			caseDiameter: product.caseDiameter,
			crystalMaterial: product.crystalMaterial,
			strapMaterial: product.strapMaterial,
			movement: product.movement,
			useCase: product.useCase,
			brandId: product.brand?.id ?? "",
			categoryIds: product.categories?.map((item) => item.id) ?? [],
			featureIds: product.features?.map((item) => item.id) ?? [],
			specificationIds: product.specifications?.map((item) => item.id) ?? [],
			factoryIds: product.factories?.map((item) => item.id) ?? [],
			supplierIds: product.suppliers?.map((item) => item.id) ?? [],
			isFeatured: product.isFeatured ?? false,
			isNew: product.isNew ?? false,
			isBestSeller: product.isBestSeller ?? false,
			isTopRated: product.isTopRated ?? false,
			isDiscounted: product.isDiscounted ?? false,
			discountPercentage: product.discountPercentage ? String(product.discountPercentage) : "",
			purchaseNotes: product.purchaseNotes ?? "",
			infinitePayId: product.infinitePayId ?? "",
			infinitePayHandle: product.infinitePayHandle ?? "",
			infinitePayDescription: product.infinitePayDescription ?? "",
			optionalItems: product.optionalItems?.map((item) => ({
				title: item.title,
				description: item.description ?? "",
				price: String(item.price),
				oldPrice: item.oldPrice ? String(item.oldPrice) : "",
				image: item.image ?? "",
			})) ?? [],
			installmentOptions: product.installmentOptions?.map((item) => ({
				label: item.label ?? "",
				installments: String(item.installments),
				installmentAmount: String(item.installmentAmount),
				totalAmount: String(item.totalAmount),
				feePercentage: item.feePercentage ? String(item.feePercentage) : "",
			})) ?? [],
			reviews: product.reviews?.map((item) => ({
				authorName: item.authorName,
				rating: String(item.rating),
				title: item.title ?? "",
				comment: item.comment ?? "",
			})) ?? [],
		});
		setDialogOpen(true);
	}

	function buildPayload(values: ProductFormValues): ProductPayload {
		return {
			name: values.name,
			model: values.model,
			description: values.description || undefined,
			status: values.status,
			price: Number.parseFloat(values.price),
			cashPrice: parseOptionalNumber(values.cashPrice),
			stock: Number.parseInt(values.stock, 10),
			images: values.images ?? [],
			tags: values.tags ?? [],
			watchType: values.watchType,
			caseMaterial: values.caseMaterial,
			caseDiameter: values.caseDiameter,
			crystalMaterial: values.crystalMaterial,
			strapMaterial: values.strapMaterial,
			movement: values.movement,
			useCase: values.useCase,
			brandId: values.brandId,
			categoryIds: values.categoryIds ?? [],
			featureIds: values.featureIds ?? [],
			specificationIds: values.specificationIds ?? [],
			factoryIds: values.factoryIds ?? [],
			supplierIds: values.supplierIds ?? [],
			isFeatured: values.isFeatured ?? false,
			isNew: values.isNew ?? false,
			isBestSeller: values.isBestSeller ?? false,
			isTopRated: values.isTopRated ?? false,
			isDiscounted: values.isDiscounted ?? false,
			discountPercentage: parseOptionalNumber(values.discountPercentage),
			purchaseNotes: values.purchaseNotes || undefined,
			infinitePayId: values.infinitePayId || undefined,
			infinitePayHandle: values.infinitePayHandle || undefined,
			infinitePayDescription: values.infinitePayDescription || undefined,
			optionalItems: (values.optionalItems ?? []).map((item) => ({
				title: item.title,
				description: item.description || undefined,
				price: Number.parseFloat(item.price),
				oldPrice: parseOptionalNumber(item.oldPrice),
				image: item.image || undefined,
			})),
			installmentOptions: (values.installmentOptions ?? []).map((item) => ({
				label: item.label || undefined,
				installments: Number.parseInt(item.installments, 10),
				installmentAmount: Number.parseFloat(item.installmentAmount),
				totalAmount: Number.parseFloat(item.totalAmount),
				feePercentage: parseOptionalNumber(item.feePercentage),
			})),
			reviews: (values.reviews ?? []).map((item) => ({
				authorName: item.authorName,
				rating: Number.parseInt(item.rating, 10),
				title: item.title || undefined,
				comment: item.comment || undefined,
			})),
		};
	}

	async function onSubmit(values: ProductFormValues) {
		const payload = buildPayload(values);
		if (selectedProduct) {
			await updateMutation.mutateAsync({ id: selectedProduct.id, data: payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		setDialogOpen(false);
		resetForm();
	}

	function scrollToModalSection(sectionId: string) {
		const scrollContainer = modalBodyRef.current;
		if (!scrollContainer) return;

		const section = scrollContainer.querySelector<HTMLElement>(`#${sectionId}`);
		if (!section) return;

		const stickyNav = scrollContainer.querySelector<HTMLElement>("[data-modal-section-nav]");
		const stickyOffset = stickyNav ? stickyNav.getBoundingClientRect().height + 24 : 96;
		const containerRect = scrollContainer.getBoundingClientRect();
		const sectionRect = section.getBoundingClientRect();
		const targetTop =
			scrollContainer.scrollTop + sectionRect.top - containerRect.top - stickyOffset;

		scrollContainer.scrollTo({
			top: Math.max(0, targetTop),
			behavior: "smooth",
		});
	}

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
							className="h-10 w-10 rounded-md border object-cover shrink-0"
						/>
					) : (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
							—
						</div>
					)}
					<div>
						<p className="font-medium text-sm">{row.original.name}</p>
						<p className="text-xs text-muted-foreground">
							{WATCH_TYPE_LABELS[row.original.watchType]} · {row.original.model}
						</p>
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
			cell: ({ row }) => (
				<div>
					<p className="font-medium tabular-nums">{formatCurrency(row.original.price)}</p>
					{row.original.cashPrice ? (
						<p className="text-xs text-muted-foreground">
							À vista: {formatCurrency(row.original.cashPrice)}
						</p>
					) : null}
				</div>
			),
		},
		{
			id: "rating",
			header: "Avaliação",
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<Star className="size-4 fill-current text-amber-500" />
					<span>
						{row.original.averageRating?.toFixed(1) ?? "—"}
						{row.original.reviewCount ? ` (${row.original.reviewCount})` : ""}
					</span>
				</div>
			),
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
				const status = STATUS_LABELS[row.original.status] ?? {
					label: row.original.status,
					variant: "outline" as const,
				};
				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
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
						className="text-destructive hover:text-destructive"
						onClick={() => {
							setSelectedProduct(row.original);
							setDeleteDialogOpen(true);
						}}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			),
		},
	];

	const isPending = createMutation.isPending || updateMutation.isPending;
	const watchedImages = useWatch({ control: form.control, name: "images" });
	const watchedOptionalItems = useWatch({ control: form.control, name: "optionalItems" });
	const watchedInstallmentOptions = useWatch({ control: form.control, name: "installmentOptions" });
	const watchedReviews = useWatch({ control: form.control, name: "reviews" });
	const imageCount = watchedImages?.length ?? 0;
	const optionalItemCount = watchedOptionalItems?.length ?? 0;
	const installmentCount = watchedInstallmentOptions?.length ?? 0;
	const reviewCount = watchedReviews?.length ?? 0;

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
					<p className="mt-1 text-muted-foreground">
						Gerencie catálogo, avaliações, parcelamentos, itens opcionais e dados do InfinitePay.
					</p>
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
				onSearchChange={(value) => {
					setSearch(value);
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

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-6xl !flex h-[92vh] min-h-0 flex-col gap-0 overflow-hidden p-0">
					<DialogHeader className="shrink-0 border-b px-6 py-5">
						<DialogTitle>{selectedProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
						<DialogDescription>
							Preencha as informações comerciais e técnicas do produto.
						</DialogDescription>
						<div className="flex flex-wrap gap-2 pt-2">
							<Badge variant="secondary">{imageCount} imagem(ns)</Badge>
							<Badge variant="secondary">{optionalItemCount} item(ns) opcional(is)</Badge>
							<Badge variant="secondary">{installmentCount} parcelamento(s)</Badge>
							<Badge variant="secondary">{reviewCount} avaliação(ões)</Badge>
						</div>
					</DialogHeader>

					<div ref={modalBodyRef} className="min-h-0 flex-1 overflow-y-auto">
						<div className="px-6 py-5">
							<div
								data-modal-section-nav
								className="sticky top-0 z-20 -mx-6 mb-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/90"
							>
								<div className="flex gap-2 overflow-x-auto pb-1">
									{PRODUCT_MODAL_SECTIONS.map((section) => (
										<Button
											key={section.id}
											type="button"
											variant="outline"
											size="sm"
											className="whitespace-nowrap rounded-full border-border/70 bg-background"
											onClick={() => scrollToModalSection(section.id)}
										>
											{section.label}
										</Button>
									))}
								</div>
								<p className="mt-2 text-xs text-muted-foreground">
									Pule entre as seções sem perder o contexto do que já foi preenchido.
								</p>
							</div>

							<div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
								<div className="rounded-2xl border border-border/70 bg-muted/15 p-4 shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
										Galeria
									</p>
									<p className="mt-2 text-lg font-semibold tracking-tight">
										{imageCount} imagem(ns)
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Arraste, selecione ou cole imagens diretamente no modal.
									</p>
								</div>
								<div className="rounded-2xl border border-border/70 bg-muted/15 p-4 shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
										Textos longos
									</p>
									<p className="mt-2 text-lg font-semibold tracking-tight">Campos redimensionáveis</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Descrições e comentários podem ser ampliados antes da revisão final.
									</p>
								</div>
								<div className="rounded-2xl border border-border/70 bg-muted/15 p-4 shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
										Checkout
									</p>
									<p className="mt-2 text-lg font-semibold tracking-tight">
										{installmentCount} condição(ões)
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Controle parcelamentos e dados do InfinitePay no mesmo fluxo.
									</p>
								</div>
								<div className="rounded-2xl border border-border/70 bg-muted/15 p-4 shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
										Conteúdo social
									</p>
									<p className="mt-2 text-lg font-semibold tracking-tight">
										{reviewCount} review(s)
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Gerencie provas sociais e itens extras sem sair da edição.
									</p>
								</div>
							</div>

							<Form {...form}>
								<form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
									<section id="identificacao" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>Identificação</CardTitle>
											<CardDescription>Dados principais exibidos no catálogo.</CardDescription>
										</CardHeader>
										<CardContent className="grid gap-4 md:grid-cols-2">
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
											<FormField
												control={form.control}
												name="description"
												render={({ field }) => (
													<FormItem className="md:col-span-2">
														<FormLabel>Descrição</FormLabel>
														<FormControl>
															<Textarea
																rows={6}
																className="min-h-40"
																placeholder="Descrição detalhada..."
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="purchaseNotes"
												render={({ field }) => (
													<FormItem className="md:col-span-2">
														<FormLabel>Notas de compra</FormLabel>
														<FormControl>
															<Textarea
																rows={5}
																className="min-h-32"
																placeholder="Observações importantes para o pedido..."
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CardContent>
									</Card>
									</section>

									<section id="comercial" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>Comercial</CardTitle>
											<CardDescription>Preço, descontos, status e destaques do produto.</CardDescription>
										</CardHeader>
										<CardContent className="space-y-5">
											<div className="grid gap-4 md:grid-cols-4">
												<FormField
													control={form.control}
													name="price"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Preço *</FormLabel>
															<FormControl>
																<Input type="number" step="0.01" placeholder="399.90" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="cashPrice"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Preço à vista</FormLabel>
															<FormControl>
																<Input type="number" step="0.01" placeholder="379.90" {...field} />
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

											<div className="grid gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="discountPercentage"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Percentual de desconto</FormLabel>
															<FormControl>
																<Input type="number" step="1" placeholder="15" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="tags"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Tags</FormLabel>
															<FormControl>
																<Input
																	placeholder="luxo, automático, esportivo"
																	value={(field.value ?? []).join(", ")}
																	onChange={(event) => {
																		const tags = event.target.value
																			.split(",")
																			.map((tag) => tag.trim())
																			.filter(Boolean);
																		field.onChange(tags);
																	}}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid gap-3 md:grid-cols-5">
												{[
													{ name: "isFeatured", label: "Em destaque" },
													{ name: "isNew", label: "Novidade" },
													{ name: "isBestSeller", label: "Mais vendido" },
													{ name: "isTopRated", label: "Bem avaliado" },
													{ name: "isDiscounted", label: "Com desconto" },
												].map((item) => (
													<FormField
														key={item.name}
														control={form.control}
														name={item.name as keyof ProductFormValues}
														render={({ field }) => (
															<FormItem className="flex min-h-12 flex-row items-center gap-3 rounded-lg border px-4 py-3">
																<FormControl>
																	<Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
																</FormControl>
																<FormLabel className="font-medium">{item.label}</FormLabel>
															</FormItem>
														)}
													/>
												))}
											</div>
										</CardContent>
									</Card>
									</section>

									<section id="checkout" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>InfinitePay</CardTitle>
											<CardDescription>Campos usados para montar o checkout integrado.</CardDescription>
										</CardHeader>
										<CardContent className="grid gap-4 md:grid-cols-3">
											<FormField
												control={form.control}
												name="infinitePayId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>ID / referência</FormLabel>
														<FormControl>
															<Input placeholder="SKU-INF-001" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="infinitePayHandle"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Handle</FormLabel>
														<FormControl>
															<Input placeholder="sua-infinitetag" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="infinitePayDescription"
												render={({ field }) => (
													<FormItem className="md:col-span-3">
														<FormLabel>Descrição no checkout</FormLabel>
														<FormControl>
															<Textarea
																rows={4}
																className="min-h-28"
																placeholder="Nome ou descrição exibida para pagamento"
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CardContent>
									</Card>
									</section>

									<section id="especificacoes" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>Especificações</CardTitle>
											<CardDescription>Características técnicas do relógio.</CardDescription>
										</CardHeader>
										<CardContent className="grid gap-4 md:grid-cols-3">
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
											<FormField
												control={form.control}
												name="caseMaterial"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Material da caixa *</FormLabel>
														<FormControl>
															<Input placeholder="Aço inox 316L" {...field} />
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
														<FormLabel>Material do cristal *</FormLabel>
														<FormControl>
															<Input placeholder="Safira" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="strapMaterial"
												render={({ field }) => (
													<FormItem className="md:col-span-3">
														<FormLabel>Material da pulseira *</FormLabel>
														<FormControl>
															<Input placeholder="Aço Oyster" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</CardContent>
									</Card>
									</section>

									<section id="relacionamentos" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>Relacionamentos</CardTitle>
											<CardDescription>Vínculos com outras entidades do catálogo.</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid gap-4 md:grid-cols-2">
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
													name="categoryIds"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Categorias</FormLabel>
															<FormControl>
																<MultiSelect
																	options={categoriesData?.data ?? []}
																	value={field.value ?? []}
																	onChange={field.onChange}
																	placeholder="Selecione as categorias"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="featureIds"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Features</FormLabel>
															<FormControl>
																<MultiSelect
																	options={featuresData?.data ?? []}
																	value={field.value ?? []}
																	onChange={field.onChange}
																	placeholder="Selecione as features"
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
															<FormLabel>Especificações</FormLabel>
															<FormControl>
																<MultiSelect
																	options={specificationsData?.data ?? []}
																	value={field.value ?? []}
																	onChange={field.onChange}
																	placeholder="Selecione as especificações"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="factoryIds"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Fábricas</FormLabel>
															<FormControl>
																<MultiSelect
																	options={factoriesData?.data ?? []}
																	value={field.value ?? []}
																	onChange={field.onChange}
																	placeholder="Selecione as fábricas"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="supplierIds"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Fornecedores</FormLabel>
															<FormControl>
																<MultiSelect
																	options={suppliersData?.data ?? []}
																	value={field.value ?? []}
																	onChange={field.onChange}
																	placeholder="Selecione os fornecedores"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</CardContent>
									</Card>
									</section>

									<section id="imagens" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader>
											<CardTitle>Imagens</CardTitle>
											<CardDescription>
												Galeria principal do produto. Voc&#234; pode arrastar, clicar ou colar
												imagens direto nesta &#225;rea.
											</CardDescription>
										</CardHeader>
										<CardContent>
											<Controller
												control={form.control}
												name="images"
												render={({ field }) => (
													<ImageUpload value={field.value ?? []} onChange={field.onChange} maxFiles={8} />
												)}
											/>
										</CardContent>
									</Card>
									</section>

									<section id="parcelamentos" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader className="flex flex-row items-center justify-between">
											<div>
												<CardTitle>Parcelamentos</CardTitle>
												<CardDescription>Cadastre taxas e condições de pagamento.</CardDescription>
											</div>
											<Button type="button" variant="outline" className="gap-2" onClick={() => installmentOptionsArray.append(emptyInstallmentOption())}>
												<Plus className="size-4" />
												Adicionar parcela
											</Button>
										</CardHeader>
										<CardContent className="space-y-4">
											{installmentOptionsArray.fields.length === 0 ? (
												<div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
													Nenhuma condi&#231;&#227;o cadastrada. Use o bot&#227;o acima para adicionar
													uma parcela e manter o checkout completo.
												</div>
											) : (
												installmentOptionsArray.fields.map((field, index) => (
													<div key={field.id} className="rounded-2xl border border-border/70 bg-muted/10 p-4">
														<div className="mb-4 flex items-center justify-between">
															<p className="font-medium">Condição #{index + 1}</p>
															<Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => installmentOptionsArray.remove(index)}>
																<Trash2 className="size-4" />
															</Button>
														</div>
														<div className="grid gap-4 md:grid-cols-4">
															<FormField
																control={form.control}
																name={`installmentOptions.${index}.label`}
																render={({ field }) => (
																	<FormItem className="md:col-span-2">
																		<FormLabel>Rótulo</FormLabel>
																		<FormControl>
																			<Input placeholder="3x sem juros" {...field} value={field.value ?? ""} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`installmentOptions.${index}.installments`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Parcelas</FormLabel>
																		<FormControl>
																			<Input type="number" placeholder="3" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`installmentOptions.${index}.feePercentage`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Taxa (%)</FormLabel>
																		<FormControl>
																			<Input type="number" step="0.01" placeholder="2.5" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`installmentOptions.${index}.installmentAmount`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Valor da parcela</FormLabel>
																		<FormControl>
																			<Input type="number" step="0.01" placeholder="133.30" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`installmentOptions.${index}.totalAmount`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Valor total</FormLabel>
																		<FormControl>
																			<Input type="number" step="0.01" placeholder="399.90" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
													</div>
												))
											)}
										</CardContent>
									</Card>
									</section>

									<section id="opcionais" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader className="flex flex-row items-center justify-between">
											<div>
												<CardTitle>Itens opcionais</CardTitle>
												<CardDescription>Upsells com foto, preço atual e preço antigo.</CardDescription>
											</div>
											<Button type="button" variant="outline" className="gap-2" onClick={() => optionalItemsArray.append(emptyOptionalItem())}>
												<Plus className="size-4" />
												Adicionar item
											</Button>
										</CardHeader>
										<CardContent className="space-y-4">
											{optionalItemsArray.fields.length === 0 ? (
												<div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
													Nenhum item opcional cadastrado. Adicione upsells com imagem e texto
													detalhado quando fizer sentido para a oferta.
												</div>
											) : (
												optionalItemsArray.fields.map((field, index) => (
													<div key={field.id} className="rounded-2xl border border-border/70 bg-muted/10 p-4">
														<div className="mb-4 flex items-center justify-between">
															<p className="font-medium">Item opcional #{index + 1}</p>
															<Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => optionalItemsArray.remove(index)}>
																<Trash2 className="size-4" />
															</Button>
														</div>
														<div className="grid gap-4 md:grid-cols-2">
															<FormField
																control={form.control}
																name={`optionalItems.${index}.title`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Título</FormLabel>
																		<FormControl>
																			<Input placeholder="Caixa premium" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`optionalItems.${index}.price`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Preço</FormLabel>
																		<FormControl>
																			<Input type="number" step="0.01" placeholder="59.90" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`optionalItems.${index}.oldPrice`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Preço antigo</FormLabel>
																		<FormControl>
																			<Input type="number" step="0.01" placeholder="79.90" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`optionalItems.${index}.description`}
																render={({ field }) => (
																	<FormItem className="md:col-span-2">
																		<FormLabel>Descrição</FormLabel>
																		<FormControl>
																			<Textarea
																				rows={5}
																				className="min-h-32"
																				placeholder="Detalhes do item opcional..."
																				{...field}
																				value={field.value ?? ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<div className="md:col-span-2">
																<FormLabel>Foto</FormLabel>
																<Controller
																	control={form.control}
																	name={`optionalItems.${index}.image`}
																	render={({ field }) => (
																		<ImageUpload
																			value={field.value ? [field.value] : []}
																			onChange={(urls) => field.onChange(urls[0] ?? "")}
																			maxFiles={1}
																		/>
																	)}
																/>
															</div>
														</div>
													</div>
												))
											)}
										</CardContent>
									</Card>
									</section>

									<section id="avaliacoes" className="scroll-mt-28">
										<Card className="border-border/70 shadow-sm">
										<CardHeader className="flex flex-row items-center justify-between">
											<div>
												<CardTitle>Avaliações</CardTitle>
												<CardDescription>Registre reviews e nota média do produto.</CardDescription>
											</div>
											<Button type="button" variant="outline" className="gap-2" onClick={() => reviewsArray.append(emptyReview())}>
												<Plus className="size-4" />
												Adicionar avaliação
											</Button>
										</CardHeader>
										<CardContent className="space-y-4">
											{reviewsArray.fields.length === 0 ? (
												<div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
													Nenhuma avalia&#231;&#227;o cadastrada. Inclua reviews e coment&#225;rios
													para enriquecer a prova social do produto.
												</div>
											) : (
												reviewsArray.fields.map((field, index) => (
													<div key={field.id} className="rounded-2xl border border-border/70 bg-muted/10 p-4">
														<div className="mb-4 flex items-center justify-between">
															<p className="font-medium">Avaliação #{index + 1}</p>
															<Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => reviewsArray.remove(index)}>
																<Trash2 className="size-4" />
															</Button>
														</div>
														<div className="grid gap-4 md:grid-cols-2">
															<FormField
																control={form.control}
																name={`reviews.${index}.authorName`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Autor</FormLabel>
																		<FormControl>
																			<Input placeholder="João" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`reviews.${index}.rating`}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Nota</FormLabel>
																		<Select value={field.value} onValueChange={field.onChange}>
																			<FormControl>
																				<SelectTrigger>
																					<SelectValue />
																				</SelectTrigger>
																			</FormControl>
																			<SelectContent>
																				{["5", "4", "3", "2", "1"].map((value) => (
																					<SelectItem key={value} value={value}>
																						{value} estrela{value !== "1" ? "s" : ""}
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
																name={`reviews.${index}.title`}
																render={({ field }) => (
																	<FormItem className="md:col-span-2">
																		<FormLabel>Título</FormLabel>
																		<FormControl>
																			<Input placeholder="Excelente acabamento" {...field} value={field.value ?? ""} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`reviews.${index}.comment`}
																render={({ field }) => (
																	<FormItem className="md:col-span-2">
																		<FormLabel>Comentário</FormLabel>
																		<FormControl>
																			<Textarea
																				rows={5}
																				className="min-h-32"
																				placeholder="Descreva a experiência..."
																				{...field}
																				value={field.value ?? ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
													</div>
												))
											)}
										</CardContent>
									</Card>
									</section>
								</form>
							</Form>
						</div>
					</div>

					<DialogFooter className="shrink-0 border-t px-6 py-4">
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancelar
						</Button>
						<Button type="submit" form="product-form" disabled={isPending}>
							{isPending ? "Salvando..." : selectedProduct ? "Salvar alterações" : "Criar produto"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Excluir produto</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir <strong>{selectedProduct?.name}</strong>? Esta ação não poderá ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							disabled={deleteMutation.isPending || !selectedProduct}
							onClick={async () => {
								if (!selectedProduct) return;
								await deleteMutation.mutateAsync(selectedProduct.id);
								setDeleteDialogOpen(false);
								setSelectedProduct(null);
							}}
						>
							{deleteMutation.isPending ? "Excluindo..." : "Excluir"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
