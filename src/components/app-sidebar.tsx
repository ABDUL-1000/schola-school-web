'use client'

import * as React from 'react'
import {
  ClipboardCheck,
  GraduationCap,
  Users,
  FileSpreadsheet,
  PenTool,
  Settings2,
  Home,
  Megaphone,
  Briefcase,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import { ModeToggle } from '@/components/mode-toggle'
import { Image } from '@unpic/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useProfileQuery } from '@/hooks/queries/profile.queries'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      isActive: true,
    },
    {
      title: 'Management',
      url: '#',
      icon: Users,
      items: [
        {
          title: 'Staff / Teachers',
          url: '/dashboard/staff',
        },
        {
          title: 'Students',
          url: '/dashboard/students',
        },
        {
          title: 'Branches',
          url: '/dashboard/branches',
        },
        {
          title: 'Departments',
          url: '/dashboard/departments',
        },
        {
          title: 'Announcements',
          url: '/dashboard/announcements',
        },
      ],
    },
    {
      title: 'Academics',
      url: '#',
      icon: GraduationCap,
      items: [
        {
          title: 'Sessions',
          url: '/dashboard/sessions',
        },
        {
          title: 'Classes',
          url: '/dashboard/classes',
        },
        {
          title: 'Subjects',
          url: '/dashboard/subjects',
        },
        {
          title: 'Timetable',
          url: '/dashboard/timetable',
        },
        {
          title: 'Lesson Notes',
          url: '/dashboard/lesson-notes',
        },
      ],
    },
    {
      title: 'Attendance',
      url: '#',
      icon: ClipboardCheck,
      items: [
        {
          title: 'Student Attendance',
          url: '/dashboard/attendance/students',
        },
        {
          title: 'Staff Attendance',
          url: '/dashboard/attendance/staff',
        },
      ],
    },
    {
      title: 'Assessments',
      url: '#',
      icon: PenTool,
      items: [
        {
          title: 'Exams & Tests',
          url: '/dashboard/exams',
        },
        {
          title: 'Assignments',
          url: '/dashboard/assignments',
        },
        {
          title: 'Results / Gradebook',
          url: '/dashboard/results',
        },
      ],
    },
    {
      title: 'HR & Payroll',
      url: '#',
      icon: Briefcase,
      items: [
        {
          title: 'Leave Requests',
          url: '/dashboard/hr/leaves',
        },
        {
          title: 'Payroll Runs',
          url: '/dashboard/hr/payroll',
        },
      ],
    },
  ],
  secondaryNav: [
    {
      name: 'Reports',
      url: '/dashboard/reports',
      icon: FileSpreadsheet,
    },
    {
      name: 'Settings',
      url: '/dashboard/settings',
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery()

  console.log('Profile >>>', profile)

  const schoolInfo = {
    name: profile?.schoolName || 'School Name',
    email: profile?.email || 'admin@school.com',
    logo: profile?.logo || '',
  }

  const dynamicNavMain = React.useMemo(() => {
    return data.navMain.map((group) => {
      if (group.title === 'Management') {
        return {
          ...group,
          items: group.items?.filter((item) => {
            if (item.title === 'Branches') {
              return profile?.schoolType === 'MULTI_BRANCH'
            }
            return true
          }),
        }
      }
      return group
    })
  }, [profile?.schoolType])

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shrink-0">
            <Image
              src="/logo.png"
              alt="Schola Logo"
              className="size-6 object-contain"
              width={24}
              height={24}
            />
          </div>
          <div className="flex flex-1 items-center justify-between overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:opacity-0">
            <div className="grid flex-1 text-left text-sm leading-tight text-white">
              <span className="truncate font-bold tracking-wider text-base group-data-[collapsible=icon]:hidden">Schola</span>
              <span className="truncate text-[10px] uppercase tracking-wider text-white/70">
                School Dashboard
              </span>
            </div>
            <ModeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={dynamicNavMain} />
        <NavProjects projects={data.secondaryNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: schoolInfo.name,
            email: schoolInfo.email,
            avatar: schoolInfo.logo,
          }}
          isLoading={isProfileLoading}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
