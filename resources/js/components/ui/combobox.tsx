import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
    allowCustom?: boolean;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    className,
    disabled = false,
    allowCustom = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedOption = options.find((option) => option.value === value)

    const handleSelect = (selectedValue: string) => {
        onValueChange?.(selectedValue === value ? "" : selectedValue)
        setOpen(false)
        setSearch("")
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (allowCustom && event.key === "Enter" && search && !options.some(o => o.value === search)) {
            event.preventDefault()
            onValueChange?.(search)
            setOpen(false)
            setSearch("")
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    {selectedOption?.label ?? value ?? placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        value={search}
                        onValueChange={setSearch}
                        onKeyDown={handleKeyDown}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom && search ? (
                                <button
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer"
                                    onClick={() => {
                                        onValueChange?.(search)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    Create "{search}"
                                </button>
                            ) : (
                                emptyText
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

interface MultiComboboxProps {
    options: ComboboxOption[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
    allowCustom?: boolean;
}

export function MultiCombobox({
    options,
    value = [],
    onValueChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    className,
    disabled = false,
    allowCustom = false,
}: MultiComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedLabels = value
        .map((v) => options.find((o) => o.value === v)?.label ?? v)
        .join(", ")

    const handleSelect = (selectedValue: string) => {
        const newValue = value.includes(selectedValue)
            ? value.filter((v) => v !== selectedValue)
            : [...value, selectedValue]
        onValueChange?.(newValue)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (allowCustom && event.key === "Enter" && search && !options.some(o => o.value === search)) {
            event.preventDefault()
            if (!value.includes(search)) {
                onValueChange?.([...value, search])
            }
            setSearch("")
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal min-h-9 h-auto",
                        !value.length && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedLabels || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        value={search}
                        onValueChange={setSearch}
                        onKeyDown={handleKeyDown}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom && search ? (
                                <button
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer"
                                    onClick={() => {
                                        if (!value.includes(search)) {
                                            onValueChange?.([...value, search])
                                        }
                                        setSearch("")
                                    }}
                                >
                                    Add "{search}"
                                </button>
                            ) : (
                                emptyText
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

