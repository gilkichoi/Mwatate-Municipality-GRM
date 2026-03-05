export interface Grievance {
  id: string;
  tracking_number: string;
  title: string;
  category: string;
  description: string;
  location: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  gender: string;
  ward: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export type GrievanceCategory = string;
