import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthPasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: boolean
  required?: boolean
  rightElement?: React.ReactNode
}

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  error,
  required = true,
  rightElement,
}: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {rightElement}
      </div>
      <InputGroup
        className={cn(
          'h-11 md:h-12',
          error && 'border-red-500 focus-visible:ring-red-500/50',
        )}
      >
        <InputGroupInput
          id={id}
          name={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className="text-base"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
