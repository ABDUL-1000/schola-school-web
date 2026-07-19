import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchoolProfileAvatarProps {
  src?: string | null
  schoolName: string
  isVerified?: boolean
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function SchoolProfileAvatar({
  src,
  schoolName,
  isVerified = false,
  className,
}: SchoolProfileAvatarProps) {
  return (
    <div className="relative inline-flex">
      <Avatar className={cn('border-2 border-blue-500 bg-background', className)}>
        {src ? <AvatarImage src={src} alt={schoolName} /> : null}
        <AvatarFallback className="text-lg font-semibold">
          {getInitials(schoolName)}
        </AvatarFallback>
      </Avatar>
      {isVerified && (
        <div className="absolute -right-1.5 -bottom-1.5 rounded-full bg-background p-0.5">
          <BadgeCheck
            className="size-7 fill-blue-500 text-white drop-shadow-sm"
            aria-label="Verified"
          />
        </div>
      )}
    </div>
  )
}
