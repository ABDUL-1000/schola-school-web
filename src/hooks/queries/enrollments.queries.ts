import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingEnrollments, getEnrollmentById, approveEnrollment } from "../api/enrollments.api";

export const usePendingEnrollmentsQuery = (query?: any) => {
  return useQuery({
    queryKey: ["pending-enrollments", query],
    queryFn: () => getPendingEnrollments(query),
  });
};

export const useEnrollmentQuery = (studentId: string) => {
  return useQuery({
    queryKey: ["enrollment", studentId],
    queryFn: () => getEnrollmentById(studentId),
    enabled: !!studentId,
  });
};

export const useApproveEnrollmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
