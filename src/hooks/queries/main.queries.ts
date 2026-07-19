import { useQuery } from '@tanstack/react-query'
import { mainApi } from '../api/main.api'

export const mainKeys = {
  all: ['main'] as const,
  dashboardMetrics: () => [...mainKeys.all, 'dashboard-metrics'] as const,
}

export function useDashboardMetricsQuery() {
  return useQuery({
    queryKey: mainKeys.dashboardMetrics(),
    queryFn: () => mainApi.getDashboardMetrics(),
  })
}
