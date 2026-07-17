import api from "@/services/api";

import {
  LotWorkData,
  PageResponse,
  RepairWorkData,
  SpecialWorkData,
  WorkerPayData,
  WorkerProfileSummary,
  WorkerStockData,
  WorkerTransactionData,
} from "@/lib/WorkerProfileData";

export interface WorkerHistoryParams {
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
}

function buildParams(params: WorkerHistoryParams) {
  const queryParams: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 8,
  };

  if (params.fromDate) {
    queryParams.fromDate = params.fromDate;
  }

  if (params.toDate) {
    queryParams.toDate = params.toDate;
  }

  return queryParams;
}

export async function fetchWorkerProfile() {
  const response =
    await api.get<WorkerProfileSummary>("/worker/profile");

  return response.data;
}

export async function fetchWorkerStocks(
  params: WorkerHistoryParams,
) {
  const response = await api.get<PageResponse<WorkerStockData>>(
    "/worker/stocks",
    {
      params: buildParams(params),
    },
  );

  return response.data;
}

export async function fetchLotWorks(
  params: WorkerHistoryParams,
) {
  const response = await api.get<PageResponse<LotWorkData>>(
    "/worker/lot-works",
    {
      params: buildParams(params),
    },
  );

  return response.data;
}

export async function fetchRepairWorks(
  params: WorkerHistoryParams,
) {
  const response = await api.get<PageResponse<RepairWorkData>>(
    "/worker/repair-works",
    {
      params: buildParams(params),
    },
  );

  return response.data;
}

export async function fetchSpecialWorks(
  params: WorkerHistoryParams,
) {
  const response = await api.get<PageResponse<SpecialWorkData>>(
    "/worker/special-works",
    {
      params: buildParams(params),
    },
  );

  return response.data;
}

export async function fetchWorkerPayments(
  params: WorkerHistoryParams,
) {
  const response = await api.get<PageResponse<WorkerPayData>>(
    "/worker/payments",
    {
      params: buildParams(params),
    },
  );

  return response.data;
}

export async function fetchWorkerTransactions(
  params: WorkerHistoryParams,
) {
  const response =
    await api.get<PageResponse<WorkerTransactionData>>(
      "/worker/transactions",
      {
        params: buildParams(params),
      },
    );

  return response.data;
}