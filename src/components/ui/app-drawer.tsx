import { type ReactNode } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'

export interface AppDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  direction?: 'top' | 'bottom' | 'left' | 'right'
}

export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  direction = 'right',
}: AppDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent>
        {(title || description) && (
          <DrawerHeader>
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
        )}

        {/* The built-in drawer scroll container. We use no-scrollbar for clean UI. */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-0">
          {children}
        </div>

        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
