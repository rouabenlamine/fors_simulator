export type UserRole = "agent" | "reporter" | "manager" | "admin" | "superadmin" | "user" | "it_support";

export interface User {
  matricule: string;
  name: string;
  surname: string;
  role: UserRole;
  permissions?: any; // JSON limits payload for Admins
}

export type TicketStatus = "pending" | "canceled" | "closed" | "sql_proposed" | "validated" | "rejected" | "analysis_pending";
export type TicketPriority = "1 - Critical" | "2 - High" | "3 - Moderate" | "4 - Low" | "5 - Planning";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  /** Raw DB state value (e.g. "Validated", "Analysis Pending") */
  state?: string;
  priority: TicketPriority;
  category: string;
  team: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  confidence: number;
  aiConfidence?: number;
  openedBy?: string;
  openedAt?: string;
  closedAt?: string;
  closedBy?: string;
  businessService?: string;
  closeNotes?: string;
  comments?: string;
  sysClassName?: string;
}

export interface TicketAnalysis {
  ticketId: string;
  rootCause: string;
  impactedTables: ImpactedTable[];
  recommendation: string;
  sqlProposal?: string;
  sqlApprovedBy?: string;
  gostSummary: string;
  urgency: "critical" | "high" | "medium" | "low";
}

export interface ImpactedTable {
  name: string;
  confidence: number;
  lostDays?: number;
  lossRate?: string;
}

export interface Conversation {
  conversationId: string;
  ticketId: string;
  userMatricule: string;
  title?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "AI" | "User";
  content: string;
  createdAt: string;
}

export interface KPI {
  id: string;
  category: KPICategory;
  label: string;
  value: string | number;
  change?: number;
  changeType?: "up" | "down";
  unit?: string;
  target?: number;
}

export type KPICategory = "sla" | "performance" | "volume" | "quality" | "knowledge";

export interface ActivityLog {
  id: string;
  action: string;
  ticketId: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}
