// Service model for frontend
export interface Service {
  id: number;
  name: string;
  slung: string;
  description: string;
  icon: string; // icon name or url
  image: string | null;
  display_order: number;
  is_active: boolean;
}
