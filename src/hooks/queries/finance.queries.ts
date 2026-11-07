import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Finance Dashboard Metrics & Reports ---
export const useFinanceDashboard = (params?: {
  sessionId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["school", "finance", "dashboard", params],
    queryFn: async () => {
      const { data } = await api.get("/school/finance/reports/dashboard", { params });
      return data.data;
    },
  });
};

// --- Fee Structures ---
export const useFeeStructures = (params?: { sessionId?: string; termId?: string }) => {
  return useQuery({
    queryKey: ["school", "finance", "structures", params],
    queryFn: async () => {
      const { data } = await api.get("/school/finance/structures", { params });
      return data.data;
    },
  });
};

export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/school/finance/structures", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

export const useSyncFeeBills = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (structureId: string) => {
      const { data } = await api.post(`/school/finance/structures/${structureId}/sync-bills`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

export const useDeleteFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (structureId: string) => {
      const { data } = await api.delete(`/school/finance/structures/${structureId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

// --- Manual Payment Recording ---
export const useRecordManualPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      billId: string;
      studentId: string;
      amount: number;
      paymentMethod: string;
      bankReference?: string;
      paymentDate?: string;
      remarks?: string;
    }) => {
      const { data } = await api.post("/school/finance/payments/manual", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

// --- Digital Receipt ---
export const useReceiptDetails = (receiptNumber: string | undefined) => {
  return useQuery({
    queryKey: ["school", "finance", "receipt", receiptNumber],
    queryFn: async () => {
      const { data } = await api.get(`/school/finance/payments/receipt/${receiptNumber}`);
      return data.data;
    },
    enabled: !!receiptNumber,
  });
};

// --- Class Fee Status ---
export const useClassFeeStatus = (classId: string | undefined, termId?: string) => {
  return useQuery({
    queryKey: ["school", "finance", "class-status", classId, termId],
    queryFn: async () => {
      const { data } = await api.get(`/school/finance/class-status/${classId}`, {
        params: { termId },
      });
      return data.data;
    },
    enabled: !!classId,
  });
};

// --- Expenses ---
export const useExpenses = (params?: { category?: string }) => {
  return useQuery({
    queryKey: ["school", "finance", "expenses", params],
    queryFn: async () => {
      const { data } = await api.get("/school/finance/expenses", { params });
      return data.data;
    },
  });
};

export const useLogExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      category: string;
      amount: number;
      expenseDate?: string;
      vendorOrPayee?: string;
      description?: string;
    }) => {
      const { data } = await api.post("/school/finance/expenses", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/school/finance/expenses/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

// --- Student Ledger & Payment History (Admin View) ---
export const useStudentFinanceLedger = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["school", "finance", "student-ledger", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await api.get(`/school/finance/students/${studentId}/ledger`);
      return data.data;
    },
    enabled: !!studentId,
  });
};

export const useStudentFinanceBills = (studentId: string | undefined, termId?: string) => {
  return useQuery({
    queryKey: ["school", "finance", "student-bills", studentId, termId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await api.get(`/school/finance/students/${studentId}/bills`, {
        params: { termId },
      });
      return data.data;
    },
    enabled: !!studentId,
  });
};

export const useAdminVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reference, gatewayName }: { reference: string; gatewayName?: string }) => {
      const { data } = await api.get(`/school/finance/payments/verify/${reference}`, {
        params: { gatewayName },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "finance"] });
    },
  });
};

