import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useGradingConfigQuery = () => {
  return useQuery({
    queryKey: ["gradingConfig"],
    queryFn: async () => {
      const { data } = await api.get("/school/grading/config");
      return data?.data;
    },
  });
};

export const useUpdateGradingConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put("/school/grading/config", payload);
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingConfig"] });
    },
  });
};

export const useClassBroadsheetQuery = (termId: string, classId: string) => {
  return useQuery({
    queryKey: ["classBroadsheet", termId, classId],
    queryFn: async () => {
      if (!termId || !classId) return null;
      const { data } = await api.get(`/school/grading/${termId}/class/${classId}/broadsheet`);
      return data?.data;
    },
    enabled: !!termId && !!classId,
  });
};

export const useGenerateReportSheetsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ termId, classId }: { termId: string; classId: string }) => {
      const { data } = await api.post(`/school/grading/${termId}/class/${classId}/generate`);
      return data?.data;
    },
    onSuccess: (_, { termId, classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classBroadsheet", termId, classId] });
    },
  });
};

export const usePublishReportSheetsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ termId, classId }: { termId: string; classId: string }) => {
      const { data } = await api.post(`/school/grading/${termId}/class/${classId}/publish`);
      return data?.data;
    },
    onSuccess: (_, { termId, classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classBroadsheet", termId, classId] });
    },
  });
};

export const useSingleReportSheetQuery = (termId: string, studentId: string) => {
  return useQuery({
    queryKey: ["singleReportSheet", termId, studentId],
    queryFn: async () => {
      if (!termId || !studentId) return null;
      const { data } = await api.get(`/school/grading/${termId}/student/${studentId}/report-sheet`);
      return data?.data;
    },
    enabled: !!termId && !!studentId,
  });
};

/** Take published results back: students/parents lose access, teachers can edit again. */
export const useUnpublishReportSheetsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ termId, classId }: { termId: string; classId: string }) => {
      const { data } = await api.post(`/school/grading/${termId}/class/${classId}/unpublish`);
      return data?.data;
    },
    onSuccess: (_, { termId, classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classBroadsheet", termId, classId] });
    },
  });
};

/** Keep results published but let teachers correct them (allow) — or lock them again. */
export const useTeacherEditsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ termId, classId, allow }: { termId: string; classId: string; allow: boolean }) => {
      const { data } = await api.post(`/school/grading/${termId}/class/${classId}/teacher-edits`, { allow });
      return data?.data;
    },
    onSuccess: (_, { termId, classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classBroadsheet", termId, classId] });
    },
  });
};

/** Save a report card design: the school default (no level) or one class level's design. */
export const useSaveReportTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { level?: string | null; template: unknown }) => {
      const { data } = await api.put("/school/grading/report-template", payload);
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingConfig"] });
      queryClient.invalidateQueries({ queryKey: ["singleReportSheet"] });
    },
  });
};

/** Make a class level use the school's default design again. */
export const useDeleteLevelReportTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (level: string) => {
      const { data } = await api.delete("/school/grading/report-template", { params: { level } });
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingConfig"] });
      queryClient.invalidateQueries({ queryKey: ["singleReportSheet"] });
    },
  });
};
