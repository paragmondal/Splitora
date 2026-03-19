import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Receipt, Star, UserPlus, Users } from 'lucide-react'
import { useRecentActivity } from '../../hooks/useActivity'
import Avatar from '../ui/Avatar'

const TYPE_CONFIG = {
  expense_added: { Icon: Receipt, bg: 'bg-blue-100', color: 'text-blue-600' },
  group_created: { Icon: Users, bg: 'bg-purple-100', color: 'text-purple-600' },
  member_added: { Icon: UserPlus, bg: 'bg-green-100', color: 'text-green-600' },
  settlement_done: { Icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  user_joined: { Icon: Star, bg: 'bg-yellow-100', color: 'text-yellow-600' },
}

const SkeletonItem = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="h-8 w-8 rounded-full bg-surface-200" />
    <div className="flex-1 space-y-1">
      <div className="h-3 w-3/4 rounded bg-surface-200" />
      <div className="h-3 w-1/3 rounded bg-surface-200" />
    </div>
  </div>
)

export default function ActivityFeed() {
  const { data, isLoading } = useRecentActivity()

  const activities = data?.data?.activities || []

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
      ) : activities.length === 0 ? (
        <p className="text-sm text-surface-600 text-center py-4">No activity yet</p>
      ) : (
        activities.map((activity) => {
          const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.expense_added
          const { Icon, bg, color } = config
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <Avatar user={activity.user} size="sm" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ${bg}`}
                >
                  <Icon size={10} className={color} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-surface-800">{activity.message}</p>
                <p className="mt-0.5 text-xs text-surface-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  {activity.group ? ` · ${activity.group.name}` : ''}
                </p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
