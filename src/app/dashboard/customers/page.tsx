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
import { Textarea } from "@/components/ui/textarea";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource } from "@/hooks/use-resource";
import { formatDate } from "@/lib/utils";

interface Customer {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	cpf: string;
	postalCode: string;
	street: string;
	neighborhood: string;
	number: string;
	complement?: string;
	city: string;
	state: string;
	fullAddress: string;
	ordersCount: number;
	createdAt: string;
}

const customerSchema = z.object({
	fullName: z.string().min(1, "Nome é obrigatório"),
	email: z.string().email("E-mail inválido"),
	phone: z.string().min(1, "Telefone é obrigatório"),
	cpf: z.string().min(1, "CPF é obrigatório"),
	postalCode: z.string().min(1, "CEP é obrigatório"),
	street: z.string().min(1, "Rua é obrigatória"),
	neighborhood: z.string().min(1, "Bairro é obrigatório"),
	number: z.string().min(1, "Número é obrigatório"),
	complement: z.string().optional(),
	city: z.string().min(1, "Cidade é obrigatória"),
	state: z.string().min(1, "UF é obrigatória").max(2, "Use a sigla da UF"),
	fullAddress: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

	const { data, isLoading } = useResourceList<Customer>("customers", {
		page,
		limit,
		...(search ? { search } : {}),
	});

	const createMutation = useCreateResource<Customer, CustomerFormValues>("customers");
	const updateMutation = useUpdateResource<Customer, CustomerFormValues>("customers");
	const deleteMutation = useDeleteResource("customers");

	const form = useForm<CustomerFormValues>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			cpf: "",
			postalCode: "",
			street: "",
			neighborhood: "",
			number: "",
			complement: "",
			city: "",
			state: "",
			fullAddress: "",
		},
	});

	function openCreate() {
		setSelectedCustomer(null);
		form.reset({
			fullName: "",
			email: "",
			phone: "",
			cpf: "",
			postalCode: "",
			street: "",
			neighborhood: "",
			number: "",
			complement: "",
			city: "",
			state: "",
			fullAddress: "",
		});
		setDialogOpen(true);
	}

	function openEdit(customer: Customer) {
		setSelectedCustomer(customer);
		form.reset({
			fullName: customer.fullName,
			email: customer.email,
			phone: customer.phone,
			cpf: customer.cpf,
			postalCode: customer.postalCode,
			street: customer.street,
			neighborhood: customer.neighborhood,
			number: customer.number,
			complement: customer.complement ?? "",
			city: customer.city,
			state: customer.state,
			fullAddress: customer.fullAddress,
		});
		setDialogOpen(true);
	}

	async function onSubmit(values: CustomerFormValues) {
		const payload = {
			...values,
			complement: values.complement || undefined,
			fullAddress: values.fullAddress || undefined,
		};

		if (selectedCustomer) {
			await updateMutation.mutateAsync({ id: selectedCustomer.id, data: payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		setDialogOpen(false);
	}

	const columns: ColumnDef<Customer>[] = [
		{
			id: "customer",
			header: "Cliente",
			cell: ({ row }) => (
				<div>
					<p className="font-medium text-sm">{row.original.fullName}</p>
					<p className="text-xs text-muted-foreground">{row.original.email}</p>
				</div>
			),
		},
		{
			id: "contact",
			header: "Contato",
			cell: ({ row }) => (
				<div className="text-sm">
					<p>{row.original.phone}</p>
					<p className="text-xs text-muted-foreground">CPF {row.original.cpf}</p>
				</div>
			),
		},
		{
			accessorKey: "fullAddress",
			header: "Endereço",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fullAddress}</span>,
		},
		{
			accessorKey: "ordersCount",
			header: "Pedidos",
			cell: ({ row }) => (
				<Badge variant="outline" className="tabular-nums">
					{row.original.ordersCount}
				</Badge>
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
							setSelectedCustomer(row.original);
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
					<h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
					<p className="mt-1 text-muted-foreground">Gerencie os dados completos dos clientes para futuras compras.</p>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="size-4" />
					Novo Cliente
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				isLoading={isLoading}
				searchPlaceholder="Pesquisar clientes..."
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
				<DialogContent className="sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>{selectedCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
						<DialogDescription>Cadastre os dados usados nos pedidos e pagamentos.</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="fullName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome completo</FormLabel>
											<FormControl>
												<Input placeholder="João da Silva" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>E-mail</FormLabel>
											<FormControl>
												<Input type="email" placeholder="joao@email.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Telefone</FormLabel>
											<FormControl>
												<Input placeholder="+5511999999999" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="cpf"
									render={({ field }) => (
										<FormItem>
											<FormLabel>CPF</FormLabel>
											<FormControl>
												<Input placeholder="12345678900" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="postalCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>CEP</FormLabel>
											<FormControl>
												<Input placeholder="01234567" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="street"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Rua</FormLabel>
											<FormControl>
												<Input placeholder="Rua das Flores" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="neighborhood"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bairro</FormLabel>
											<FormControl>
												<Input placeholder="Centro" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="number"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Número</FormLabel>
											<FormControl>
												<Input placeholder="123" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cidade</FormLabel>
											<FormControl>
												<Input placeholder="São Paulo" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem>
											<FormLabel>UF</FormLabel>
											<FormControl>
												<Input placeholder="SP" maxLength={2} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="complement"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Complemento</FormLabel>
											<FormControl>
												<Input placeholder="Apto, bloco, referência..." {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="fullAddress"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Endereço completo</FormLabel>
											<FormControl>
												<Textarea rows={3} placeholder="Se vazio, o sistema monta automaticamente." {...field} value={field.value ?? ""} />
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
									{isPending ? "Salvando..." : selectedCustomer ? "Salvar alterações" : "Criar cliente"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Excluir cliente</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir <strong>{selectedCustomer?.fullName}</strong>?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							disabled={deleteMutation.isPending || !selectedCustomer}
							onClick={async () => {
								if (!selectedCustomer) return;
								await deleteMutation.mutateAsync(selectedCustomer.id);
								setDeleteDialogOpen(false);
								setSelectedCustomer(null);
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
