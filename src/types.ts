export interface Grievance {
  id: string;
  tracking_number: string;
  title: string;
  category: string;
  description: string;
  location: string;
  contact_info: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export type GrievanceCategory = string;
