import { ProviderService } from '../models/ProviderService';

const API_URL = 'http://192.168.1.31:8000/api/provider-services/';

export async function fetchProviderServicesByCategory(categoryId: number): Promise<ProviderService[]> {
  const response = await fetch(`${API_URL}?service_category=${categoryId}`);
  if (!response.ok) throw new Error('Failed to fetch provider services');
  return response.json();
}
