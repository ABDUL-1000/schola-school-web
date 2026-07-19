import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, CalendarDays, Pencil, CheckCircle2, Circle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { Badge } from '@/components/ui/badge'
import {
  useSessionsQuery,
  useCreateSessionMutation,
  useActivateSessionMutation,
  useUpdateTermDatesMutation,
} from '@/hooks/queries/academic.queries'

export const Route = createFileRoute('/_authenticated/dashboard/sessions')({
  component: AcademicSessionsPage,
})

function AcademicSessionsPage() {
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
  const [sessionFormData, setSessionFormData] = useState({ name: '', startDate: '', endDate: '' })

  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<any>(null)
  const [termFormData, setTermFormData] = useState({ startDate: '', endDate: '' })

  const { data: sessions = [], isLoading } = useSessionsQuery()
  const createSession = useCreateSessionMutation()
  const activateSession = useActivateSessionMutation()
  const updateTerm = useUpdateTermDatesMutation()

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionFormData.name || !sessionFormData.startDate || !sessionFormData.endDate) {
      toast.error('Please fill all fields')
      return
    }

    createSession.mutate({
      name: sessionFormData.name,
      startDate: new Date(sessionFormData.startDate),
      endDate: new Date(sessionFormData.endDate),
    }, {
      onSuccess: () => {
        setIsSessionDialogOpen(false)
        setSessionFormData({ name: '', startDate: '', endDate: '' })
        toast.success('Session created successfully')
      },
      onError: (err: any) => toast.error(err.message || 'Failed to create session')
    })
  }

  const handleUpdateTerm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!termFormData.startDate || !termFormData.endDate) {
      toast.error('Please fill both dates')
      return
    }

    updateTerm.mutate({
      termId: editingTerm.id,
      startDate: new Date(termFormData.startDate),
      endDate: new Date(termFormData.endDate),
    }, {
      onSuccess: () => {
        setIsTermDialogOpen(false)
        setEditingTerm(null)
        setTermFormData({ startDate: '', endDate: '' })
        toast.success('Term dates updated successfully')
      },
      onError: (err: any) => toast.error(err.message || 'Failed to update term')
    })
  }

  const handleActivate = (sessionId: string) => {
    activateSession.mutate(sessionId, {
      onSuccess: () => toast.success('Active session updated'),
      onError: (err: any) => toast.error(err.message || 'Failed to activate session')
    })
  }

  const openTermEdit = (term: any) => {
    setEditingTerm(term)
    setTermFormData({
      startDate: format(new Date(term.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(term.endDate), 'yyyy-MM-dd'),
    })
    setIsTermDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Sessions</h2>
          <p className="text-muted-foreground">
            Manage academic years and configure term dates
          </p>
        </div>
        <Button onClick={() => setIsSessionDialogOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Session
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No academic sessions found. Create your first session to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session: any) => (
            <Card key={session.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {session.name}
                    {session.isCurrent && (
                      <Badge variant="default" className="ml-2">Active</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(session.startDate), 'MMM d, yyyy')} - {format(new Date(session.endDate), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleActivate(session.id)}
                    disabled={activateSession.isPending}
                  >
                    <Circle className="size-4" />
                    Set as Active
                  </Button>
                )}
                {session.isCurrent && (
                  <Button variant="ghost" size="sm" className="gap-2 pointer-events-none text-green-600 hover:text-green-600 hover:bg-transparent">
                    <CheckCircle2 className="size-4" />
                    Current Session
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.terms?.map((term: any) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell>{format(new Date(term.startDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(term.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openTermEdit(term)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                placeholder="e.g., 2027/2028"
                value={sessionFormData.name}
                onChange={(e) => setSessionFormData({ ...sessionFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !sessionFormData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sessionFormData.startDate ? format(new Date(sessionFormData.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={sessionFormData.startDate ? new Date(sessionFormData.startDate) : undefined}
                      onSelect={(date) => setSessionFormData({ ...sessionFormData, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}                      
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !sessionFormData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sessionFormData.endDate ? format(new Date(sessionFormData.endDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={sessionFormData.endDate ? new Date(sessionFormData.endDate) : undefined}
                      onSelect={(date) => setSessionFormData({ ...sessionFormData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}                      
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSession.isPending}>
                Create Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Term Dates: {editingTerm?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTerm} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termStartDate">Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !termFormData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {termFormData.startDate ? format(new Date(termFormData.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={termFormData.startDate ? new Date(termFormData.startDate) : undefined}
                      onSelect={(date) => setTermFormData({ ...termFormData, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}                      
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="termEndDate">End Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !termFormData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {termFormData.endDate ? format(new Date(termFormData.endDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={termFormData.endDate ? new Date(termFormData.endDate) : undefined}
                      onSelect={(date) => setTermFormData({ ...termFormData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}                      
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTermDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTerm.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
