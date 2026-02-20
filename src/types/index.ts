export type UserRole = 'operator' | 'qc' | 'me' | 'supervisor' | 'manager' | 'admin';
export type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';
export type EquipmentStatus = 'running' | 'stopped' | 'maintenance' | 'breakdown';
export type InspectionType = 'incoming' | 'in_process' | 'outgoing';
export type DefectDisposition = 'rework' | 'scrap' | 'use_as_is' | 'return';
export type ShipStatus = 'planned' | 'packed' | 'shipped' | 'delivered';

export interface ProductionKpi {
  plannedQty: number;
  producedQty: number;
  defectQty: number;
  achievementRate: number;
  defectRate: number;
  activeOrders: number;
}

export interface OeeData {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface WorkOrderSummary {
  id: string;
  woNo: string;
  productName: string;
  customerName: string;
  plannedQty: number;
  producedQty: number;
  defectQty: number;
  status: WoStatus;
  dueDate: string;
  priority: number;
  achievementRate: number;
}
