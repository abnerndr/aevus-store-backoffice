"use client"

import { ChevronDown, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
	id: string
	name: string
}

interface MultiSelectProps {
	options: MultiSelectOption[]
	value: string[]
	onChange: (ids: string[]) => void
	placeholder?: string
	label?: string
	disabled?: boolean
	className?: string
}

export function MultiSelect({
	options,
	value,
	onChange,
	placeholder = "Selecione...",
	label,
	disabled = false,
	className,
}: MultiSelectProps) {
	const selected = options.filter((o) => value.includes(o.id))

	function toggle(id: string) {
		if (value.includes(id)) {
			onChange(value.filter((v) => v !== id))
		} else {
			onChange([...value, id])
		}
	}

	return (
		<div className={cn("space-y-2", className)}>
			{label && (
				<label className="text-sm font-medium leading-none">{label}</label>
			)}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						disabled={disabled}
						className={cn(
							"w-full justify-between font-normal min-h-9 h-auto py-2",
							!value.length && "text-muted-foreground"
						)}
					>
						<div className="flex flex-wrap gap-1">
							{selected.length > 0 ? (
								selected.map((opt) => (
									<Badge
										key={opt.id}
										variant="secondary"
										className="gap-0.5 pr-1 text-xs font-normal"
									>
										{opt.name}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												onChange(value.filter((v) => v !== opt.id))
											}}
											className="ml-0.5 rounded-full hover:bg-muted p-0.5"
										>
											<X className="size-3" />
										</button>
									</Badge>
								))
							) : (
								<span>{placeholder}</span>
							)}
						</div>
						<ChevronDown className="size-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
					<ScrollArea className="max-h-60">
						<div className="p-1">
							{options.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									Nenhuma opção disponível
								</p>
							) : (
								options.map((opt) => (
									<label
										key={opt.id}
										className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
									>
										<Checkbox
											checked={value.includes(opt.id)}
											onCheckedChange={() => toggle(opt.id)}
										/>
										{opt.name}
									</label>
								))
							)}
						</div>
					</ScrollArea>
				</PopoverContent>
			</Popover>
		</div>
	)
}
