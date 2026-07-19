import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAnnouncementsQuery, useCreateAnnouncementMutation, useDeleteAnnouncementMutation } from '@/hooks/queries/announcement.queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect } from '@/components/ui/custom-select'
import { Megaphone, Trash2, Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/dashboard/announcements')({
  component: AnnouncementsPage,
})

function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState('ALL')

  const { data: response, isLoading } = useAnnouncementsQuery()
  const announcements = response?.announcements || []

  const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncementMutation()
  const { mutate: deleteAnnouncement } = useDeleteAnnouncementMutation()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    createAnnouncement(
      { title, content, target },
      {
        onSuccess: () => {
          setTitle('')
          setContent('')
          setTarget('ALL')
          setShowCreate(false)
        }
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            School Announcements
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Manage and broadcast announcements across the school
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          {showCreate ? 'Cancel' : <><Plus className="h-4 w-4" /> New Announcement</>}
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/50 shadow-sm animate-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
            <CardDescription>Broadcast a message to the entire school or specific groups.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input 
                    placeholder="E.g. Public Holiday Notice" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Audience</label>
                  <CustomSelect
                    value={target}
                    onValueChange={setTarget}
                    items={[
                      { label: 'Entire School', value: 'ALL' },
                      { label: 'Staff Only', value: 'STAFF' },
                      { label: 'Students Only', value: 'STUDENTS' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message Content</label>
                <Textarea 
                  placeholder="Write your announcement here..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!title.trim() || !content.trim() || isCreating}>
                  {isCreating ? 'Publishing...' : 'Publish Announcement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-lg bg-card/50">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No Announcements</h3>
            <p className="text-sm text-muted-foreground">There are no announcements to show at this time.</p>
          </div>
        ) : (
          announcements.map((announcement: any) => (
            <Card key={announcement.id} className="bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {announcement.target === 'ALL' ? 'BROADCAST' : announcement.target}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(announcement.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="flex items-start">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if(confirm('Delete this announcement?')) {
                        deleteAnnouncement(announcement.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
