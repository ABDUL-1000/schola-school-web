import { CustomSelect } from '@/components/ui/custom-select'
import { useClassesQuery } from '@/hooks/queries/class.queries'

interface ClassSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
}

export function ClassSelector({
  value,
  onValueChange,
  placeholder = 'Select a class',
  className,
  label,
  required = false,
}: ClassSelectorProps) {
  const { data: classesData, isLoading } = useClassesQuery(undefined, undefined, 1, 100)

  const classesList = classesData?.data?.map((c: any) => ({
    value: c.id,
    label: c.name,
  })) || []

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-[14px] font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <CustomSelect
        value={value}
        onValueChange={onValueChange}
        placeholder={isLoading ? 'Loading classes...' : classesList.length === 0 ? 'No classes found' : placeholder}
        items={classesList}
        disabled={isLoading || classesList.length === 0}
      />
    </div>
  )
}
