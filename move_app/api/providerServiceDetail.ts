import { ProviderService } from '../models/ProviderService';

const API_URL = 'http://192.168.1.31:8000/api/provider-services/';

export async function fetchProviderServiceById(id: number, token?: string): Promise<ProviderService> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  const response = await fetch(`${API_URL}${id}/`, { headers });
  if (!response.ok) throw new Error('Failed to fetch provider service');
  return response.json();
}
