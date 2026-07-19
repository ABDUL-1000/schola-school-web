import { api } from '@/lib/api'

export const getPendingEnrollments = async (query?: any) => {
  const { data } = await api.get("/school/enrollments", { params: query });
  return data;
};

export const getEnrollmentById = async (studentId: string) => {
  const { data } = await api.get(`/school/enrollments/${studentId}`);
  return data;
};

export const approveEnrollment = async ({ studentId, payload }: { studentId: string; payload: any }) => {
  const { data } = await api.patch(`/school/enrollments/${studentId}/approve`, payload);
  return data;
};
