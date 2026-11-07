import { Link } from '@tanstack/react-router'

/** Shown under a "Branch" field when the school has no branches yet. */
export function NoBranchesHint({ branches }: { branches?: Array<unknown> }) {
  if (!branches || branches.length > 0) return null
  return (
    <p className="text-sm text-muted-foreground">
      Your school has no branches yet.{' '}
      <Link to="/dashboard/settings" search={{ tab: 'branches' }} className="font-medium text-primary underline">
        Add a branch in Settings
      </Link>{' '}
      first.
    </p>
  )
}
