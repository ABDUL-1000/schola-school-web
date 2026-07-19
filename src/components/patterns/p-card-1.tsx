import { ArrowUpRight } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PCard1Props {
  title: string
  description: string
  className?: string
}

export function PCard1({ title, description, className }: PCard1Props) {
  return (
    <Card
      className={cn(
        'group relative transition-all hover:border-primary/50 hover:shadow-md',
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
