import type {
  ContentQueueItem,
  Competitor,
  Lead,
  LessonLearned,
  DashboardSummary,
  HealthCheckResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getHealth: async (): Promise<HealthCheckResponse> => {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthCheckResponse>(res);
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE_URL}/analytics/summary`);
    return handleResponse<DashboardSummary>(res);
  },

  getQueue: async (params?: { brand?: string; status?: string }): Promise<ContentQueueItem[]> => {
    const query = new URLSearchParams();
    if (params?.brand) query.append('brand', params.brand);
    if (params?.status) query.append('status', params.status);
    const res = await fetch(`${API_BASE_URL}/queue?${query.toString()}`);
    return handleResponse<ContentQueueItem[]>(res);
  },

  getCompetitors: async (): Promise<Competitor[]> => {
    const res = await fetch(`${API_BASE_URL}/competitors`);
    return handleResponse<Competitor[]>(res);
  },

  getLeads: async (): Promise<Lead[]> => {
    const res = await fetch(`${API_BASE_URL}/leads`);
    return handleResponse<Lead[]>(res);
  },

  getLessons: async (): Promise<LessonLearned[]> => {
    const res = await fetch(`${API_BASE_URL}/lessons`);
    return handleResponse<LessonLearned[]>(res);
  },

  reviewContent: async (
    contentId: number,
    action: 'approve' | 'reject' | 'edit',
    data?: { notes?: string; reason_tag?: string; corrected_content?: string }
  ): Promise<ContentQueueItem> => {
    const res = await fetch(`${API_BASE_URL}/queue/${contentId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id: contentId,
        action,
        ...data,
      }),
    });
    return handleResponse<ContentQueueItem>(res);
  },

  runAgent: async (agentName: string, payload: Record<string, any>): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/agents/run/${agentName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  }
};
