"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface ProductOption {
	id: string;
	name: string;
}

interface Promotion {
	id: string;
	name: string;
	description?: string;
	type: "PERCENTAGE" | "FIXED";
	value: number;
	isActive: boolean;
	startsAt?: string;
	endsAt?: string;
	products: ProductOption[];
	createdAt: string;
}

const promotionSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	description: z.string().optional(),
	type: z.enum(["PERCENTAGE", "FIXED"]),
	value: z.string().min(1, "Valor é obrigatório"),
	isActive: z.boolean().default(true),
	startsAt: z.string().optional(),
	endsAt: z.string().optional(),
	productIds: z.array(z.string()).default([]),
});

type PromotionFormValues = z.input<typeof promotionSchema>;

function toDateTimeLocal(value?: string) {
	if (!value) return "";
	const date = new Date(value);
	const pad = (input: number) => input.toString().padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PromotionsPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

	const { data, isLoading } = useResourceList<Promotion>("promotions", {
		page,
		limit,
		...(search ? { search } : {}),
	});
	const { data: productsData } = useResourceList<ProductOption>("products", { limit: 200 });

	const createMutation = useCreateResource<Promotion, Record<string, unknown>>("promotions");
	const updateMutation = useUpdateResource<Promotion, Record<string, unknown>>("promotions");
	const deleteMutation = useDeleteResource("promotions");

	const form = useForm<PromotionFormValues>({
		resolver: zodResolver(promotionSchema),
		defaultValues: {
			name: "",
			description: "",
			type: "PERCENTAGE",
			value: "",
			isActive: true,
			startsAt: "",
			endsAt: "",
			productIds: [],
		},
	});

	function openCreate() {
		setSelectedPromotion(null);
		form.reset({
			name: "",
			description: "",
			type: "PERCENTAGE",
			value: "",
			isActive: true,
			startsAt: "",
			endsAt: "",
			productIds: [],
		});
		setDialogOpen(true);
	}

	function openEdit(promotion: Promotion) {
		setSelectedPromotion(promotion);
		form.reset({
			name: promotion.name,
			description: promotion.description ?? "",
			type: promotion.type,
			value: String(promotion.value),
			isActive: promotion.isActive,
			startsAt: toDateTimeLocal(promotion.startsAt),
			endsAt: toDateTimeLocal(promotion.endsAt),
			productIds: promotion.products.map((product) => product.id),
		});
		setDialogOpen(true);
	}

	async function onSubmit(values: PromotionFormValues) {
		const payload = {
			name: values.name,
			description: values.description || undefined,
			type: values.type,
			value: Number.parseFloat(values.value),
			isActive: values.isActive,
			startsAt: values.startsAt || undefined,
			endsAt: values.endsAt || undefined,
			productIds: values.productIds ?? [],
		};

		if (selectedPromotion) {
			await updateMutation.mutateAsync({ id: selectedPromotion.id, data: payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		setDialogOpen(false);
	}

	const columns: ColumnDef<Promotion>[] = [
		{
			id: "promotion",
			header: "Promoção",
			cell: ({ row }) => (
				<div>
					<p className="font-medium text-sm">{row.original.name}</p>
					<p className="text-xs text-muted-foreground">{row.original.description ?? "Sem descrição"}</p>
				</div>
			),
		},
		{
			id: "discount",
			header: "Desconto",
			cell: ({ row }) => (
				<span className="text-sm">
					{row.original.type === "PERCENTAGE" ? `${row.original.value}%` : formatCurrency(row.original.value)}
				</span>
			),
		},
		{
			id: "products",
			header: "Produtos",
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1">
					{row.original.products.length > 0 ? (
						row.original.products.slice(0, 2).map((product) => (
							<Badge key={product.id} variant="secondary" className="text-xs">
								{product.name}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">Global</span>
					)}
					{row.original.products.length > 2 ? (
						<Badge variant="outline" className="text-xs">
							+{row.original.products.length - 2}
						</Badge>
					) : null}
				</div>
			),
		},
		{
			accessorKey: "isActive",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={row.original.isActive ? "default" : "secondary"}>
					{row.original.isActive ? "Ativa" : "Inativa"}
				</Badge>
			),
		},
		{
			id: "period",
			header: "Período",
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground">
					<p>{row.original.startsAt ? formatDate(row.original.startsAt) : "Imediato"}</p>
					<p>{row.original.endsAt ? `até ${formatDate(row.original.endsAt)}` : "Sem data final"}</p>
				</div>
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
						className="text-destructive hover:text-destructive"
						onClick={() => {
							setSelectedPromotion(row.original);
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

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Promoções</h1>
					<p className="mt-1 text-muted-foreground">Gerencie campanhas globais ou vinculadas a produtos específicos.</p>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="size-4" />
					Nova Promoção
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				isLoading={isLoading}
				searchPlaceholder="Pesquisar promoções..."
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
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>{selectedPromotion ? "Editar Promoção" : "Nova Promoção"}</DialogTitle>
						<DialogDescription>Defina desconto, vigência e os produtos participantes.</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome</FormLabel>
											<FormControl>
												<Input placeholder="Semana do Cliente" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo</FormLabel>
											<Select value={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="PERCENTAGE">Percentual</SelectItem>
													<SelectItem value="FIXED">Valor fixo</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Valor</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" placeholder="15" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="isActive"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center gap-3 rounded-lg border px-4 py-3">
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<FormLabel>Promoção ativa</FormLabel>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="startsAt"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Início</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="endsAt"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Fim</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="productIds"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Produtos participantes</FormLabel>
											<FormControl>
												<MultiSelect
													options={productsData?.data ?? []}
													value={field.value ?? []}
													onChange={field.onChange}
													placeholder="Sem seleção = promoção global"
												/>
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
												<Textarea rows={3} placeholder="Detalhes da campanha..." {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending ? "Salvando..." : selectedPromotion ? "Salvar alterações" : "Criar promoção"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Excluir promoção</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir <strong>{selectedPromotion?.name}</strong>?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							disabled={deleteMutation.isPending || !selectedPromotion}
							onClick={async () => {
								if (!selectedPromotion) return;
								await deleteMutation.mutateAsync(selectedPromotion.id);
								setDeleteDialogOpen(false);
								setSelectedPromotion(null);
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
