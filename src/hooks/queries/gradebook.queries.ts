import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useSubjectGradebookQuery = (termId: string, classId: string, subjectId: string) => {
  return useQuery({
    queryKey: ["subjectGradebook", termId, classId, subjectId],
    queryFn: async () => {
      if (!termId || !classId || !subjectId) return null;
      const { data } = await api.get(`/school/gradebook/${termId}/class/${classId}/subject/${subjectId}`);
      return data?.data;
    },
    enabled: !!termId && !!classId && !!subjectId,
  });
};

export const useClassBroadsheetQuery = (termId: string, classId: string) => {
  return useQuery({
    queryKey: ["classBroadsheet", termId, classId],
    queryFn: async () => {
      if (!termId || !classId) return null;
      const { data } = await api.get(`/school/gradebook/${termId}/class/${classId}/broadsheet`);
      return data?.data;
    },
    enabled: !!termId && !!classId,
  });
};
