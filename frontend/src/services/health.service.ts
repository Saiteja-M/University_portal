import { apiClient } from '../lib/axios'

export interface HealthResponse {
  status: string
  service: string
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>(
    '/health/',
  )

  return response.data
}