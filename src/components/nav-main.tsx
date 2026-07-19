import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: Array<{
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: Array<{
      title: string
      url: string
    }>
  }>
}) {
  const { pathname } = useLocation()
  const { state, setOpen } = useSidebar()
  const [openSection, setOpenSection] = React.useState<string | null>(null)

  // Update open section based on current route
  React.useEffect(() => {
    const activeSection = items.find((item) =>
      item.items?.some((sub) => pathname === sub.url),
    )
    if (activeSection) {
      setOpenSection(activeSection.title)
    } else {
      setOpenSection(null)
    }
  }, [pathname, items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70 tracking-wider">Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasItems = item.items && item.items.length > 0
          const isActive = pathname === item.url

          if (!hasItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="pl-4"
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          const isSectionOpen = openSection === item.title
          const isSectionActive = item.items?.some((subItem) => pathname === subItem.url)

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isSectionOpen}
              onOpenChange={(open) => setOpenSection(open ? item.title : null)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    closeOnMobileClick={false}
                    className="pl-4"
                    isActive={isSectionActive && state === 'collapsed'}
                    onClick={() => {
                      if (state === 'collapsed') {
                        setOpen(true)
                      }
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
