import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface TagOption {
    value: string;
    label: string;
}

interface TagInputProps {
    options?: TagOption[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    allowCustom?: boolean;
    maxTags?: number;
}

export function TagInput({
    options = [],
    value = [],
    onValueChange,
    placeholder = "Add tag...",
    className,
    disabled = false,
    allowCustom = true,
    maxTags,
}: TagInputProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const availableOptions = options.filter((option) => !value.includes(option.value))
    
    const filteredOptions = availableOptions.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.value.toLowerCase().includes(inputValue.toLowerCase())
    )

    const canAddMore = !maxTags || value.length < maxTags

    const handleRemove = (tagValue: string) => {
        onValueChange?.(value.filter((v) => v !== tagValue))
    }

    const handleAdd = (tagValue: string) => {
        if (!canAddMore) return
        if (!value.includes(tagValue)) {
            onValueChange?.([...value, tagValue])
        }
        setInputValue("")
        setOpen(false)
        inputRef.current?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && inputValue) {
            event.preventDefault()
            if (allowCustom && canAddMore) {
                const existingOption = options.find(
                    (o) => o.value.toLowerCase() === inputValue.toLowerCase() ||
                           o.label.toLowerCase() === inputValue.toLowerCase()
                )
                handleAdd(existingOption?.value ?? inputValue)
            } else if (filteredOptions.length > 0) {
                handleAdd(filteredOptions[0].value)
            }
        } else if (event.key === "Backspace" && !inputValue && value.length > 0) {
            handleRemove(value[value.length - 1])
        } else if (event.key === "Escape") {
            setOpen(false)
        }
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        if (newValue && (options.length > 0 || allowCustom)) {
            setOpen(true)
        }
    }

    const showDropdown = open && (filteredOptions.length > 0 || (allowCustom && inputValue))

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex flex-wrap gap-1.5 p-2 min-h-10 rounded-md border border-input bg-background",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tagValue) => {
                    const option = options.find((o) => o.value === tagValue)
                    return (
                        <Badge
                            key={tagValue}
                            variant="secondary"
                            className="gap-1 pr-1"
                        >
                            {option?.label ?? tagValue}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(tagValue)
                                    }}
                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    )
                })}
                {canAddMore && !disabled && (
                    <Popover open={showDropdown} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    if (inputValue || options.length > 0) {
                                        setOpen(true)
                                    }
                                }}
                                onBlur={() => {
                                    // Delay closing to allow click on options
                                    setTimeout(() => setOpen(false), 150)
                                }}
                                placeholder={value.length === 0 ? placeholder : ""}
                                className="flex-1 min-w-[120px] border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                                disabled={disabled}
                            />
                        </PopoverTrigger>
                        {showDropdown && (
                            <PopoverContent 
                                className="w-[--radix-popover-trigger-width] p-0" 
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <Command>
                                    <CommandList>
                                        <CommandEmpty>
                                            {allowCustom && inputValue ? (
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        handleAdd(inputValue)
                                                    }}
                                                >
                                                    Create "{inputValue}"
                                                </button>
                                            ) : (
                                                "No options available."
                                            )}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {filteredOptions.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={option.value}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        handleAdd(option.value)
                                                    }}
                                                    onSelect={() => handleAdd(option.value)}
                                                >
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        )}
                    </Popover>
                )}
            </div>
            {maxTags && (
                <p className="text-xs text-muted-foreground">
                    {value.length} / {maxTags} tags
                </p>
            )}
        </div>
    )
}

