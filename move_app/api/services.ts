import { Service } from '../models/Service';

const API_URL = 'http://192.168.1.31:8000/api/categories/'; // Use your computer's local IP for device access

export async function fetchServices(): Promise<Service[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
}
