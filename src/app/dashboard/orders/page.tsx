"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useResourceList, useUpdateResource } from "@/hooks/use-resource";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderOptionalItem {
	id: string;
	title: string;
	description?: string;
	image?: string;
	quantity: number;
	unitPrice: number;
	oldPrice?: number;
	total: number;
}

interface OrderItem {
	id: string;
	productName: string;
	productModel?: string;
	description?: string;
	image?: string;
	quantity: number;
	unitPrice: number;
	cashPrice?: number;
	subtotal: number;
	promotionDiscount: number;
	total: number;
	appliedPromotionName?: string;
	optionalItems: OrderOptionalItem[];
}

interface Order {
	id: string;
	orderNumber: string;
	orderNsu: string;
	status: "REALIZADO" | "PAGO" | "AGUARDANDO_ENVIO" | "ENVIADO" | "ENTREGUE";
	paymentStatus: "PENDING" | "PAID" | "FAILED" | "CANCELED" | "REFUNDED";
	captureMethod: "PIX" | "CREDIT_CARD" | "UNKNOWN";
	infinitePayHandle?: string;
	infinitePayInvoiceSlug?: string;
	infinitePayTransactionNsu?: string;
	infinitePayCheckoutUrl?: string;
	infinitePayReceiptUrl?: string;
	subtotal: number;
	promotionDiscount: number;
	couponDiscount: number;
	shippingAmount: number;
	total: number;
	paidAmount?: number;
	installments?: number;
	notes?: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	customerCpf: string;
	fullAddress: string;
	coupon?: { id: string; code: string; type: "PERCENTAGE" | "FIXED"; value: number };
	items: OrderItem[];
	paidAt?: string;
	createdAt: string;
}

const orderSchema = z.object({
	status: z.enum(["REALIZADO", "PAGO", "AGUARDANDO_ENVIO", "ENVIADO", "ENTREGUE"]),
	notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const ORDER_STATUS_LABELS: Record<Order["status"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
	REALIZADO: { label: "Realizado", variant: "secondary" },
	PAGO: { label: "Pago", variant: "default" },
	AGUARDANDO_ENVIO: { label: "Aguardando envio", variant: "outline" },
	ENVIADO: { label: "Enviado", variant: "outline" },
	ENTREGUE: { label: "Entregue", variant: "default" },
};

const PAYMENT_STATUS_LABELS: Record<Order["paymentStatus"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
	PENDING: { label: "Pendente", variant: "secondary" },
	PAID: { label: "Pago", variant: "default" },
	FAILED: { label: "Falhou", variant: "destructive" },
	CANCELED: { label: "Cancelado", variant: "outline" },
	REFUNDED: { label: "Reembolsado", variant: "outline" },
};

const CAPTURE_METHOD_LABELS: Record<Order["captureMethod"], string> = {
	PIX: "Pix",
	CREDIT_CARD: "Cartão",
	UNKNOWN: "Não informado",
};

export default function OrdersPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

	const { data, isLoading } = useResourceList<Order>("orders", {
		page,
		limit,
		...(search ? { search } : {}),
	});

	const updateMutation = useUpdateResource<Order, OrderFormValues>("orders");

	const form = useForm<OrderFormValues>({
		resolver: zodResolver(orderSchema),
		defaultValues: {
			status: "REALIZADO",
			notes: "",
		},
	});

	useEffect(() => {
		if (!selectedOrder) return;
		form.reset({
			status: selectedOrder.status,
			notes: selectedOrder.notes ?? "",
		});
	}, [selectedOrder, form]);

	async function onSubmit(values: OrderFormValues) {
		if (!selectedOrder) return;
		await updateMutation.mutateAsync({
			id: selectedOrder.id,
			data: {
				status: values.status,
				notes: values.notes || undefined,
			},
		});
		setDialogOpen(false);
	}

	const columns: ColumnDef<Order>[] = [
		{
			id: "order",
			header: "Pedido",
			cell: ({ row }) => (
				<div>
					<p className="font-medium text-sm">{row.original.orderNumber}</p>
					<p className="text-xs text-muted-foreground">{row.original.orderNsu}</p>
				</div>
			),
		},
		{
			id: "customer",
			header: "Cliente",
			cell: ({ row }) => (
				<div>
					<p className="font-medium text-sm">{row.original.customerName}</p>
					<p className="text-xs text-muted-foreground">{row.original.customerEmail}</p>
				</div>
			),
		},
		{
			accessorKey: "total",
			header: "Total",
			cell: ({ row }) => (
				<div>
					<p className="font-medium">{formatCurrency(row.original.total)}</p>
					<p className="text-xs text-muted-foreground">{row.original.items.length} item(ns)</p>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Pedido",
			cell: ({ row }) => {
				const status = ORDER_STATUS_LABELS[row.original.status];
				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
		},
		{
			accessorKey: "paymentStatus",
			header: "Pagamento",
			cell: ({ row }) => {
				const payment = PAYMENT_STATUS_LABELS[row.original.paymentStatus];
				return <Badge variant={payment.variant}>{payment.label}</Badge>;
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
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => {
						setSelectedOrder(row.original);
						setDialogOpen(true);
					}}
				>
					<Edit className="size-4" />
				</Button>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
				<p className="mt-1 text-muted-foreground">Acompanhe status, pagamento, notas e dados completos das compras.</p>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				isLoading={isLoading}
				searchPlaceholder="Pesquisar pedidos..."
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
				<DialogContent className="sm:max-w-6xl !flex h-[90vh] flex-col gap-0 overflow-hidden p-0">
					<DialogHeader className="shrink-0 border-b px-6 py-5">
						<DialogTitle>{selectedOrder?.orderNumber ?? "Pedido"}</DialogTitle>
						<DialogDescription>
							Resumo completo do pedido, pagamento e dados do cliente.
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto px-6 py-5">
						{selectedOrder ? (
							<div className="space-y-6">
								<div className="grid gap-4 md:grid-cols-4">
									<Card>
										<CardHeader>
											<CardTitle>Status do pedido</CardTitle>
										</CardHeader>
										<CardContent>
											<Badge variant={ORDER_STATUS_LABELS[selectedOrder.status].variant}>
												{ORDER_STATUS_LABELS[selectedOrder.status].label}
											</Badge>
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Status do pagamento</CardTitle>
										</CardHeader>
										<CardContent>
											<Badge variant={PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus].variant}>
												{PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus].label}
											</Badge>
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Total</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-lg font-semibold">{formatCurrency(selectedOrder.total)}</p>
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Pagamento</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="font-medium">{CAPTURE_METHOD_LABELS[selectedOrder.captureMethod]}</p>
											<p className="text-sm text-muted-foreground">
												{selectedOrder.installments ? `${selectedOrder.installments} parcela(s)` : "Sem parcelas"}
											</p>
										</CardContent>
									</Card>
								</div>

								<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
									<div className="space-y-6">
										<Card>
											<CardHeader>
												<CardTitle>Itens do pedido</CardTitle>
												<CardDescription>Produtos, opcionais, descontos e totais.</CardDescription>
											</CardHeader>
											<CardContent className="space-y-4">
												{selectedOrder.items.map((item) => (
													<div key={item.id} className="rounded-xl border p-4">
														<div className="flex items-start justify-between gap-4">
															<div>
																<p className="font-medium">{item.productName}</p>
																<p className="text-sm text-muted-foreground">
																	{item.productModel ?? "Sem modelo"} · {item.quantity} unidade(s)
																</p>
																{item.appliedPromotionName ? (
																	<p className="text-xs text-emerald-600">
																		Promoção aplicada: {item.appliedPromotionName}
																	</p>
																) : null}
															</div>
															<div className="text-right text-sm">
																<p className="font-medium">{formatCurrency(item.total)}</p>
																<p className="text-muted-foreground">
																	Unitário: {formatCurrency(item.unitPrice)}
																</p>
															</div>
														</div>
														{item.description ? (
															<p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
														) : null}
														{item.optionalItems.length > 0 ? (
															<div className="mt-4 rounded-lg bg-muted/40 p-3">
																<p className="mb-2 text-sm font-medium">Itens opcionais</p>
																<div className="space-y-2">
																	{item.optionalItems.map((optionalItem) => (
																		<div key={optionalItem.id} className="flex items-center justify-between text-sm">
																			<div>
																				<p>{optionalItem.title}</p>
																				<p className="text-xs text-muted-foreground">
																					{optionalItem.quantity}x {formatCurrency(optionalItem.unitPrice)}
																				</p>
																			</div>
																			<span>{formatCurrency(optionalItem.total)}</span>
																		</div>
																	))}
																</div>
															</div>
														) : null}
													</div>
												))}
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle>Notas de compra</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm text-muted-foreground">{selectedOrder.notes || "Sem observações registradas."}</p>
											</CardContent>
										</Card>
									</div>

									<div className="space-y-6">
										<Card>
											<CardHeader>
												<CardTitle>Cliente</CardTitle>
											</CardHeader>
											<CardContent className="space-y-2 text-sm">
												<p><span className="font-medium">Nome:</span> {selectedOrder.customerName}</p>
												<p><span className="font-medium">E-mail:</span> {selectedOrder.customerEmail}</p>
												<p><span className="font-medium">Telefone:</span> {selectedOrder.customerPhone}</p>
												<p><span className="font-medium">CPF:</span> {selectedOrder.customerCpf}</p>
												<p><span className="font-medium">Endereço:</span> {selectedOrder.fullAddress}</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle>Pagamento</CardTitle>
											</CardHeader>
											<CardContent className="space-y-2 text-sm">
												<p><span className="font-medium">Subtotal:</span> {formatCurrency(selectedOrder.subtotal)}</p>
												<p><span className="font-medium">Desconto em promoções:</span> {formatCurrency(selectedOrder.promotionDiscount)}</p>
												<p><span className="font-medium">Desconto em cupom:</span> {formatCurrency(selectedOrder.couponDiscount)}</p>
												<p><span className="font-medium">Frete:</span> {formatCurrency(selectedOrder.shippingAmount)}</p>
												<p><span className="font-medium">Total:</span> {formatCurrency(selectedOrder.total)}</p>
												<p><span className="font-medium">Pago:</span> {selectedOrder.paidAmount ? formatCurrency(selectedOrder.paidAmount) : "Ainda não pago"}</p>
												<p><span className="font-medium">Cupom:</span> {selectedOrder.coupon ? `${selectedOrder.coupon.code}` : "Sem cupom"}</p>
												<p><span className="font-medium">Método:</span> {CAPTURE_METHOD_LABELS[selectedOrder.captureMethod]}</p>
												<p><span className="font-medium">Pago em:</span> {selectedOrder.paidAt ? formatDate(selectedOrder.paidAt) : "Aguardando pagamento"}</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle>InfinitePay</CardTitle>
											</CardHeader>
											<CardContent className="space-y-2 text-sm">
												<p><span className="font-medium">Handle:</span> {selectedOrder.infinitePayHandle ?? "—"}</p>
												<p><span className="font-medium">Invoice slug:</span> {selectedOrder.infinitePayInvoiceSlug ?? "—"}</p>
												<p><span className="font-medium">Transaction NSU:</span> {selectedOrder.infinitePayTransactionNsu ?? "—"}</p>
												<p><span className="font-medium">Checkout URL:</span> {selectedOrder.infinitePayCheckoutUrl ?? "—"}</p>
												<p><span className="font-medium">Recibo:</span> {selectedOrder.infinitePayReceiptUrl ?? "—"}</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader>
												<CardTitle>Atualizar pedido</CardTitle>
												<CardDescription>Controle manual do fluxo logístico.</CardDescription>
											</CardHeader>
											<CardContent>
												<Form {...form}>
													<form id="order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
														<FormField
															control={form.control}
															name="status"
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Status do pedido</FormLabel>
																	<Select value={field.value} onValueChange={field.onChange}>
																		<FormControl>
																			<SelectTrigger>
																				<SelectValue />
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent>
																			<SelectItem value="REALIZADO">Realizado</SelectItem>
																			<SelectItem value="PAGO">Pago</SelectItem>
																			<SelectItem value="AGUARDANDO_ENVIO">Aguardando envio</SelectItem>
																			<SelectItem value="ENVIADO">Enviado</SelectItem>
																			<SelectItem value="ENTREGUE">Entregue</SelectItem>
																		</SelectContent>
																	</Select>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name="notes"
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Notas</FormLabel>
																	<FormControl>
																		<Textarea rows={4} placeholder="Observações do pedido..." {...field} value={field.value ?? ""} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</form>
												</Form>
											</CardContent>
										</Card>
									</div>
								</div>
							</div>
						) : null}
					</div>

					<DialogFooter className="shrink-0 border-t px-6 py-4">
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Fechar
						</Button>
						<Button type="submit" form="order-form" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "Salvando..." : "Salvar status"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
