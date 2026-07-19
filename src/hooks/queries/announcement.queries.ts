import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementApi } from '../api/announcement.api'

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (filters: any) => [...announcementKeys.all, 'list', filters] as const,
}

export function useAnnouncementsQuery(filters: any = {}) {
  return useQuery({
    queryKey: announcementKeys.list(filters),
    queryFn: () => announcementApi.getAnnouncements(filters),
  })
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => announcementApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
  })
}

export function useDeleteAnnouncementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (announcementId: string) => announcementApi.deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
  })
}
