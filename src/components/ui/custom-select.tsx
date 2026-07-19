import * as React from 'react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface CustomSelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Select>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  items: Array<{ label: React.ReactNode; value: string | null }>
  label?: React.ReactNode
  description?: React.ReactNode
  error?: string | Array<{ message?: string } | undefined>
  placeholder?: string
  className?: string
  fieldClassName?: string
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
}

export function CustomSelect({
  items,
  label,
  description,
  error,
  placeholder,
  className,
  fieldClassName,
  value,
  defaultValue,
  onValueChange,
  ...props
}: CustomSelectProps) {
  // Convert standard string error to FieldError's array format if needed
  const normalizedError =
    typeof error === 'string' ? [{ message: error }] : error

  const handleValueChange = (v: string) => {
    if (onValueChange) {
      onValueChange(v === '_none_' ? '' : v)
    }
  }

  const selectValue =
    typeof value !== 'undefined'
      ? value === '' || value === null
        ? '_none_'
        : value
      : undefined
  const selectDefaultValue =
    typeof defaultValue !== 'undefined'
      ? defaultValue === '' || defaultValue === null
        ? '_none_'
        : defaultValue
      : undefined

  return (
    <Field className={fieldClassName} data-invalid={!!error}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        value={selectValue}
        defaultValue={selectDefaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {items.map((item, index) => {
              const itemValue =
                item.value === null || item.value === '' ? '_none_' : item.value

              return (
                <SelectItem key={itemValue || index} value={itemValue}>
                  {item.label}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={normalizedError} />}
    </Field>
  )
}
