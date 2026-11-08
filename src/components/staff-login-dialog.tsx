import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdateStaffLoginMutation } from '@/hooks/queries/staff.queries'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Readable random password: no look-alike characters (0/O, 1/l/I). */
function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const pick = (set: string, n: number) => {
    const bytes = crypto.getRandomValues(new Uint32Array(n))
    return Array.from(bytes, (b) => set[b % set.length]).join('')
  }
  return `${pick(letters, 4)}-${pick(digits, 4)}-${pick(letters, 4)}`
}

export interface StaffLoginTarget {
  id: string
  fullname: string
  email: string
}

/**
 * Lets the school change a staff member's sign-in email and/or set a new password.
 * The staff member is signed out everywhere once it is saved.
 */
export function StaffLoginDialog({ staff, onClose }: { staff: StaffLoginTarget | null; onClose: () => void }) {
  const update = useUpdateStaffLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [notify, setNotify] = useState(true)
  const [done, setDone] = useState<{ email: string; password: string; emailedTo: string | null; notifyFailed: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setEmail(staff?.email || '')
    setPassword('')
    setShow(false)
    setNotify(true)
    setDone(null)
    setCopied(false)
  }, [staff?.id])

  if (!staff) return null

  const cleanEmail = email.trim().toLowerCase()
  const emailChanged = cleanEmail !== staff.email.toLowerCase()
  const emailError = email && !EMAIL_RE.test(cleanEmail) ? 'Enter a valid email address' : ''
  const passwordError = password && password.length < 8 ? 'At least 8 characters' : ''
  const canSave = !emailError && !passwordError && (emailChanged || password.length >= 8) && !update.isPending

  const save = async () => {
    try {
      const res = await update.mutateAsync({
        staffId: staff.id,
        ...(emailChanged ? { email: cleanEmail } : {}),
        ...(password ? { password } : {}),
        notify,
      })
      setDone({
        email: res.data.staff.email || cleanEmail,
        password,
        emailedTo: res.data.emailedTo ?? null,
        notifyFailed: !!res.data.notifyFailed,
      })
      toast.success('Sign-in details updated')
    } catch (e: any) {
      toast.error(e?.message || 'Could not update the sign-in details')
    }
  }

  const copyDetails = async () => {
    if (!done) return
    const text = `Your Schola staff sign-in\nEmail: ${done.email}${done.password ? `\nPassword: ${done.password}` : ''}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the details and copy them manually')
    }
  }

  return (
    <Dialog open={!!staff} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign-in details</DialogTitle>
          <DialogDescription>{staff.fullname}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div>
                Email: <code className="font-mono">{done.email}</code>
              </div>
              {done.password && (
                <div>
                  Password: <code className="font-mono">{done.password}</code>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {done.emailedTo
                  ? `These details were emailed to ${done.emailedTo}.`
                  : done.notifyFailed
                    ? 'The email could not be sent. Copy these details and share them with the staff member.'
                    : 'Share these details with the staff member.'}{' '}
                They have been signed out and must use the new details.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={copyDetails}>
                {copied ? <Check className="mr-2 size-4 text-emerald-600" /> : <Copy className="mr-2 size-4" />}
                Copy details
              </Button>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-login-email">Sign-in email</Label>
              <Input id="staff-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-login-password">New password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="staff-login-password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep the current one"
                    autoComplete="new-password"
                    className="pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPassword(generatePassword())
                    setShow(true)
                  }}
                >
                  <RefreshCw className="mr-1.5 size-4" /> Generate
                </Button>
              </div>
              {passwordError ? (
                <p className="text-xs text-destructive">{passwordError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">At least 8 characters. Setting one also activates an account whose invite was never accepted.</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} className="mt-0.5" />
              <span>
                Email the new details to the staff member
                <span className="block text-xs text-muted-foreground">Sent to {EMAIL_RE.test(cleanEmail) ? cleanEmail : 'their sign-in email'}.</span>
              </span>
            </label>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave}>
                {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
