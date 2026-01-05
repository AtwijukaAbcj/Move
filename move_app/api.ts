// API utility for backend requests
import axios from 'axios';

const API_BASE = 'http://192.168.1.31:8000/api'; // Updated for LAN access

export const fetchServices = async () => {
  const res = await axios.get(`${API_BASE}/services/`);
  return res.data;
};

export const fetchSuppliersByService = async (serviceId: number) => {
  const res = await axios.get(`${API_BASE}/suppliers/`, { params: { service: serviceId } });
  return res.data;
};

export const fetchCarsBySupplier = async (supplierId: number) => {
  const res = await axios.get(`${API_BASE}/cars/`, { params: { supplier: supplierId } });
  return res.data;
};

export const createBooking = async (data: any, token?: string | null) => {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  const res = await axios.post(`${API_BASE}/corporate/service-bookings/`, data, { headers });
  return res.data;
};
