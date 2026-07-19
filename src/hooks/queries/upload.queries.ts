import { useMutation } from '@tanstack/react-query'
import { uploadApi } from '../api/upload.api'

export const uploadKeys = {
  all: ['upload'] as const,
}

export function useUploadFileMutation() {
  return useMutation({
    mutationFn: uploadApi.uploadFile,
  })
}
