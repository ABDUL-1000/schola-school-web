import * as React from 'react'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { Image } from '@unpic/react'

export function TeamSwitcher({
  teams,
}: {
  teams: Array<{
    name: string
    logo: React.ElementType
    plan: string
    image?: string
  }>
}) {
  if (teams.length === 0) {
    return null
  }
  const activeTeam = teams[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 px-1.5 py-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
            {activeTeam.image ? (
              <Image
                src={activeTeam.image}
                alt={activeTeam.name}
                className="size-full object-cover"
                width={32}
                height={32}
              />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">{activeTeam.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {activeTeam.plan}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
