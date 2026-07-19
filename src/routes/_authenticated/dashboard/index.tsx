import { createFileRoute, Link } from '@tanstack/react-router'
import { useDashboardMetricsQuery } from '@/hooks/queries/main.queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarDays,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data, isLoading, isError } = useDashboardMetricsQuery()

  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Failed to load dashboard metrics.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const metrics = data?.metrics
  const upcomingExams = data?.upcomingExams || []
  const recentLessonNotes = data?.recentLessonNotes || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening in your school right now.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalBranches || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Active school branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalStaff || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered teachers and admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalClasses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Across all branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalStudents || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalSubjects || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Active curriculum subjects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalAssignments || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Given to students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lesson Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalLessonNotes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Prepared by teachers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.totalExams || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled or published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-6">
        {/* Daily Attendance Widget */}
        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Today's Attendance Overview
            </CardTitle>
            <CardDescription>
              School-wide student attendance summary for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : metrics?.attendance?.totalMarked === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No attendance marked yet today</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Marked</p>
                  <p className="text-2xl font-black">{metrics?.attendance?.totalMarked || 0}</p>
                </div>
                <div className="p-4 bg-success/10 text-success rounded-lg text-center">
                  <p className="text-xs uppercase font-bold tracking-wider mb-1">Present</p>
                  <p className="text-2xl font-black">{metrics?.attendance?.present || 0}</p>
                </div>
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center">
                  <p className="text-xs uppercase font-bold tracking-wider mb-1">Absent</p>
                  <p className="text-2xl font-black">{metrics?.attendance?.absent || 0}</p>
                </div>
                <div className="p-4 bg-amber-500/10 text-amber-600 rounded-lg text-center">
                  <p className="text-xs uppercase font-bold tracking-wider mb-1">Late</p>
                  <p className="text-2xl font-black">{metrics?.attendance?.late || 0}</p>
                </div>
                <div className="p-4 bg-blue-500/10 text-blue-600 rounded-lg text-center">
                  <p className="text-xs uppercase font-bold tracking-wider mb-1">Excused</p>
                  <p className="text-2xl font-black">{metrics?.attendance?.excused || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Exams */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Upcoming Published Exams
            </CardTitle>
            <CardDescription>
              The most recent exams scheduled for students.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingExams.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
                <CalendarDays className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No upcoming exams</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exams that are published will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingExams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{exam.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-primary">
                          {exam.class?.name}
                        </span>
                        <span>•</span>
                        <span>{exam.subject?.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(exam.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exam.duration} mins
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Lesson Notes */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Lesson Notes
              </CardTitle>
              <CardDescription className="mt-1.5">
                Latest notes prepared by teachers.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link to="/dashboard/lesson-notes">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLessonNotes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No lesson notes yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When teachers submit notes, they'll show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentLessonNotes.map((note: any) => (
                  <Link
                    key={note.id}
                    to="/dashboard/lesson-notes/$id"
                    params={{ id: note.id }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:underline">
                        {note.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.teacher?.fullname} • {note.class?.name} (
                        {note.subject?.name})
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                      {format(new Date(note.date), 'MMM d')}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-6 sm:hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/lesson-notes">View All Notes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
