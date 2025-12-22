import { ProviderService } from '../models/ProviderService';

const API_URL = 'http://192.168.1.31:8000/api/provider-services/';

export async function fetchProviderServicesByCategory(categoryId: number, token?: string): Promise<ProviderService[]> {
  const url = `${API_URL}?service_category=${categoryId}`;
  console.log('[fetchProviderServicesByCategory] Fetching:', url);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    console.log('[fetchProviderServicesByCategory] Error:', response.status, errorText);
    throw new Error('Failed to fetch provider services');
  }
  const data = await response.json();
  console.log('[fetchProviderServicesByCategory] Data:', data);
  return data;
}
