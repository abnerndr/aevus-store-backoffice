"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
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

interface Coupon {
	id: string;
	code: string;
	description?: string;
	type: "PERCENTAGE" | "FIXED";
	value: number;
	minimumOrderAmount?: number;
	maxUses?: number;
	usedCount: number;
	isActive: boolean;
	startsAt?: string;
	endsAt?: string;
	createdAt: string;
}

const couponSchema = z.object({
	code: z.string().min(1, "Código é obrigatório"),
	description: z.string().optional(),
	type: z.enum(["PERCENTAGE", "FIXED"]),
	value: z.string().min(1, "Valor é obrigatório"),
	minimumOrderAmount: z.string().optional(),
	maxUses: z.string().optional(),
	isActive: z.boolean().default(true),
	startsAt: z.string().optional(),
	endsAt: z.string().optional(),
});

type CouponFormValues = z.input<typeof couponSchema>;

function toDateTimeLocal(value?: string) {
	if (!value) return "";
	const date = new Date(value);
	const pad = (input: number) => input.toString().padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CouponsPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

	const { data, isLoading } = useResourceList<Coupon>("coupons", {
		page,
		limit,
		...(search ? { search } : {}),
	});

	const createMutation = useCreateResource<Coupon, Record<string, unknown>>("coupons");
	const updateMutation = useUpdateResource<Coupon, Record<string, unknown>>("coupons");
	const deleteMutation = useDeleteResource("coupons");

	const form = useForm<CouponFormValues>({
		resolver: zodResolver(couponSchema),
		defaultValues: {
			code: "",
			description: "",
			type: "PERCENTAGE",
			value: "",
			minimumOrderAmount: "",
			maxUses: "",
			isActive: true,
			startsAt: "",
			endsAt: "",
		},
	});

	function openCreate() {
		setSelectedCoupon(null);
		form.reset({
			code: "",
			description: "",
			type: "PERCENTAGE",
			value: "",
			minimumOrderAmount: "",
			maxUses: "",
			isActive: true,
			startsAt: "",
			endsAt: "",
		});
		setDialogOpen(true);
	}

	function openEdit(coupon: Coupon) {
		setSelectedCoupon(coupon);
		form.reset({
			code: coupon.code,
			description: coupon.description ?? "",
			type: coupon.type,
			value: String(coupon.value),
			minimumOrderAmount: coupon.minimumOrderAmount ? String(coupon.minimumOrderAmount) : "",
			maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
			isActive: coupon.isActive,
			startsAt: toDateTimeLocal(coupon.startsAt),
			endsAt: toDateTimeLocal(coupon.endsAt),
		});
		setDialogOpen(true);
	}

	async function onSubmit(values: CouponFormValues) {
		const payload = {
			code: values.code.trim().toUpperCase(),
			description: values.description || undefined,
			type: values.type,
			value: Number.parseFloat(values.value),
			minimumOrderAmount: values.minimumOrderAmount ? Number.parseFloat(values.minimumOrderAmount) : undefined,
			maxUses: values.maxUses ? Number.parseInt(values.maxUses, 10) : undefined,
			isActive: values.isActive,
			startsAt: values.startsAt || undefined,
			endsAt: values.endsAt || undefined,
		};

		if (selectedCoupon) {
			await updateMutation.mutateAsync({ id: selectedCoupon.id, data: payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		setDialogOpen(false);
	}

	const columns: ColumnDef<Coupon>[] = [
		{
			id: "coupon",
			header: "Cupom",
			cell: ({ row }) => (
				<div>
					<p className="font-medium text-sm">{row.original.code}</p>
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
			id: "usage",
			header: "Uso",
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground">
					<p>{row.original.usedCount} usado(s)</p>
					<p>{row.original.maxUses ? `Máx. ${row.original.maxUses}` : "Sem limite"}</p>
				</div>
			),
		},
		{
			accessorKey: "isActive",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={row.original.isActive ? "default" : "secondary"}>
					{row.original.isActive ? "Ativo" : "Inativo"}
				</Badge>
			),
		},
		{
			id: "validity",
			header: "Vigência",
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
							setSelectedCoupon(row.original);
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
					<h1 className="text-2xl font-bold tracking-tight">Cupons</h1>
					<p className="mt-1 text-muted-foreground">Crie regras de desconto e acompanhe o uso de cada cupom.</p>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="size-4" />
					Novo Cupom
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				isLoading={isLoading}
				searchPlaceholder="Pesquisar cupons..."
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
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{selectedCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
						<DialogDescription>Configure desconto, limite de uso e período de vigência.</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Código</FormLabel>
											<FormControl>
												<Input placeholder="BEMVINDO10" {...field} />
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
												<Input type="number" step="0.01" placeholder="10" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="minimumOrderAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pedido mínimo</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" placeholder="300.00" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="maxUses"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Máximo de usos</FormLabel>
											<FormControl>
												<Input type="number" placeholder="100" {...field} />
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
											<FormLabel>Cupom ativo</FormLabel>
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
									name="description"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Descrição</FormLabel>
											<FormControl>
												<Textarea rows={3} placeholder="Explique a regra ou campanha..." {...field} value={field.value ?? ""} />
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
									{isPending ? "Salvando..." : selectedCoupon ? "Salvar alterações" : "Criar cupom"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Excluir cupom</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir <strong>{selectedCoupon?.code}</strong>?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							disabled={deleteMutation.isPending || !selectedCoupon}
							onClick={async () => {
								if (!selectedCoupon) return;
								await deleteMutation.mutateAsync(selectedCoupon.id);
								setDeleteDialogOpen(false);
								setSelectedCoupon(null);
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
