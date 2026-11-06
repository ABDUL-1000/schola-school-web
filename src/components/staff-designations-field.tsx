import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export type Designation = 'ADMIN' | 'BURSAR' | 'EXAM_OFFICER'

export const DESIGNATIONS: Array<{ value: Designation; label: string; description: string }> = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Manage teachers, classes and students; view all results and report cards.',
  },
  {
    value: 'BURSAR',
    label: 'Bursar',
    description: 'Set school fees, record payments, see who has paid or is owing, and all finance records.',
  },
  {
    value: 'EXAM_OFFICER',
    label: 'Exam officer',
    description: 'Review exam and test questions (written and CBT): approve, reject or comment.',
  },
]

export const designationLabel = (d: string) => DESIGNATIONS.find((x) => x.value === d)?.label || d

/** Legacy staff created with roles=ADMIN count as holding the Admin designation. */
export const initialDesignations = (staff: any): Array<Designation> => {
  const list: Array<Designation> = Array.isArray(staff?.designations) ? [...staff.designations] : []
  if (staff?.roles === 'ADMIN' && !list.includes('ADMIN')) list.push('ADMIN')
  return list
}

/**
 * Extra responsibilities on top of teaching. A staff member can hold several.
 * Form masters are assigned per class from the Classes page.
 */
export function StaffDesignationsField({
  value,
  onChange,
}: {
  value: Array<Designation>
  onChange: (next: Array<Designation>) => void
}) {
  const toggle = (d: Designation, on: boolean) =>
    onChange(on ? Array.from(new Set([...value, d])) : value.filter((x) => x !== d))

  return (
    <div className="space-y-2">
      <Label>Responsibilities</Label>
      <p className="text-xs text-muted-foreground">
        Every staff member is a teacher. Tick any extra roles they hold.
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {DESIGNATIONS.map((d) => (
          <label
            key={d.value}
            className="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <Checkbox
              checked={value.includes(d.value)}
              onCheckedChange={(v) => toggle(d.value, !!v)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium">{d.label}</span>
              <span className="block text-xs text-muted-foreground">{d.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
