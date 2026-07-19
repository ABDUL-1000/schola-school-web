import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Contracts
export const useStaffContract = (staffId: string | undefined) => {
  return useQuery({
    queryKey: ["school", "hr", "contract", staffId],
    queryFn: async () => {
      const { data } = await api.get(`/school/hr/contracts/${staffId}`);
      return data.data;
    },
    enabled: !!staffId,
  });
};

export const useUpdateStaffContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, payload }: { staffId: string; payload: any }) => {
      const { data } = await api.patch(`/school/hr/contracts/${staffId}`, payload);
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["school", "hr", "contract", variables.staffId] });
    },
  });
};

// Leaves
export const useLeaveRequests = (status?: string) => {
  return useQuery({
    queryKey: ["school", "hr", "leaves", status],
    queryFn: async () => {
      const { data } = await api.get(`/school/hr/leave-requests`, {
        params: { status }
      });
      return data.data;
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { status: string; reviewRemark?: string } }) => {
      const { data } = await api.patch(`/school/hr/leave-requests/${id}/status`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "hr", "leaves"] });
    },
  });
};

// Payroll
export const useGeneratePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { month: number; year: number }) => {
      const { data } = await api.post(`/school/hr/payroll/generate`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "hr", "payroll"] });
    },
  });
};

export const usePayrollRecords = (month: number, year: number) => {
  return useQuery({
    queryKey: ["school", "hr", "payroll", month, year],
    queryFn: async () => {
      const { data } = await api.get(`/school/hr/payroll`, {
        params: { month, year }
      });
      return data.data;
    },
  });
};

export const useUpdatePayrollRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/school/hr/payroll/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "hr", "payroll"] });
    },
  });
};
