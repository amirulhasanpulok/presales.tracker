export type OpportunityStage = 
  | 'qualification'
  | 'tech_discovery'
  | 'solution_design'
  | 'poc_demo'
  | 'proposal_boq'
  | 'commercial_negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold'
  | 'cancelled';

export type DealComplexity = 'low' | 'medium' | 'high' | 'critical';
export type TechnicalFitScore = 'perfect' | 'good' | 'moderate' | 'challenging';
export type DealPriority = 'p0_urgent' | 'p1_high' | 'p2_medium' | 'p3_low';
export type CloudProvider = 'AWS' | 'Google Cloud' | 'Azure' | 'Hybrid / On-Prem' | 'Multi-Cloud' | 'Kubernetes' | 'AI / LLM Infra';
export type POCStatus = 'not_started' | 'scoping' | 'provisioning' | 'active_testing' | 'validating_kpis' | 'passed' | 'failed' | 'cancelled';
export type ApprovalStatus = 'draft' | 'pending_sa_lead' | 'pending_sales_vp' | 'pending_finance' | 'approved' | 'rejected';

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  influence: 'high' | 'medium' | 'low';
  sentiment: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker';
  buyingRole: 'Economic Buyer' | 'Technical Gatekeeper' | 'User Influencer' | 'Procurement' | 'Security Officer' | 'Executive Sponsor';
  notes?: string;
  lastContactDate: string;
}

export interface OpportunityDocument {
  id: string;
  title: string;
  type: 'Architecture Diagram' | 'SADD Blueprint' | 'RFP Response' | 'Security Whitepaper' | 'BOQ Sheet' | 'SOW Draft' | 'POC Report';
  version: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Approved' | 'In Review' | 'Draft' | 'Customer Signed';
  fileUrl?: string;
  fileName?: string;
  fileData?: string;
  description?: string;
}

export interface BOQItem {
  id: string;
  category: 'Cloud Infrastructure' | 'Software Licenses' | 'Hardware' | 'Professional Services' | 'Managed Support' | 'Security & Compliance';
  itemCode: string;
  description: string;
  unit: 'Instances/Mo' | 'TB/Mo' | 'Users/Yr' | 'Man-Days' | 'Core-Hrs' | 'Flat Fee' | 'License/Yr' | string;
  quantity: number;
  unitCost: number;
  unitListPrice: number;
  discountPercent: number;
  extendedPrice: number;
  marginPercent: number;
  notes?: string;
  // Section 10/11: OEM & Product references for catalog-driven BOQ
  oem?: string;
  productName?: string;
  model?: string;
  partNumber?: string;
}

export interface BOQRevision {
  id: string;
  version: number;
  savedAt: string;
  savedBy?: string;
  status: ApprovalStatus;
  snapshot: Omit<BOQSummary, 'revisions'>;
}

export interface BOQSummary {
  items: BOQItem[];
  subtotalCost: number;
  subtotalListPrice: number;
  totalDiscountAmount: number;
  totalContractValue: number;
  annualRecurringRevenue: number;
  oneTimeServicesValue: number;
  overallMarginPercent: number;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedDate?: string;
  version: number;
  revisions?: BOQRevision[];
}

export interface POCDetails {
  status: POCStatus;
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  environmentUrl?: string;
  awsAccountId?: string;
  region?: string;
  allocatedBudget: number;
  successCriteria: {
    id: string;
    description: string;
    targetMetric: string;
    actualMetric?: string;
    verified: boolean;
    verifiedByCustomer?: string;
    category: 'Performance' | 'Security' | 'Integration' | 'Reliability' | 'Cost Efficiency';
  }[];
  blockers: {
    id: string;
    description: string;
    severity: 'blocking' | 'critical' | 'minor';
    openedAt: string;
    resolved: boolean;
    owner: string;
  }[];
  customerSignOffDate?: string;
  satisfactionScore?: number;
}

export interface PresalesActivity {
  id: string;
  type: 'Phone Call' | 'Email' | 'Client Meeting' | 'Internal Meeting' | 'Online Meeting' | 'Site Survey' | 'Requirement Gathering' | 'Technical Discussion' | 'OEM Discussion' | 'Solution Design' | 'BOQ Preparation' | 'Proposal Submission' | 'Follow-up' | 'Commercial Discussion' | 'Tender Activity' | 'Documentation' | 'Other' | 'Architectural Review' | 'Discovery Call' | 'Security Questionnaire' | 'Demo' | 'RFP / RFI Response' | 'Executive Briefing' | 'Whiteboarding' | 'BOQ Review';
  title: string;
  timestamp: string;
  author: string;
  authorAvatar?: string;
  summary: string;
  durationMinutes: number;
  deliverables?: string[];
  nextSteps?: string;
  attendees: string[];
  currentStage?: string;
  nextAction?: string;
  nextFollowUpDate?: string;
  attachments?: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  assignedTo: string;
  assignedToRole: string;
  dueDate: string;
  isCompleted: boolean;
  priority: DealPriority;
  category: 'Architecture' | 'Sizing & BOQ' | 'Security / Compliance' | 'Customer Follow-up' | 'Legal / SOW' | 'POC Execution';
  notes?: string;
}

export interface HandoverDetails {
  isHandedOver: boolean;
  handoverDate?: string;
  handedOverBy?: string;
  salesKAM?: string;
  boqVersion?: string;
  status?: 'pending' | 'ready' | 'handed_over';
  technicalNotes?: string;
  attachedDocuments?: string[];
  assignedDeliveryLead?: string;
  assignedCustomerSuccessManager?: string;
  architectureDiagramUrl?: string;
  technicalRunbookReady: boolean;
  credentialsSecurelyTransferred: boolean;
  customerTechKickoffScheduled: boolean;
  kickoffDate?: string;
  knownTechnicalDebtOrRisks: string[];
  specialSLAsAgreed: string[];
  notes?: string;
}

// Section 15: Tender Management
export interface TenderInfo {
  isTender: boolean;
  tenderName?: string;
  tenderReference?: string;
  publishingOrganization?: string;
  publishDate?: string;
  submissionDeadline?: string;
  complianceRequirements?: string[];
  submissionStatus?: string;
  result?: string;
  tenderDocumentsSummary?: string;
}

// Section 16: Deal Outcome (won/lost capture)
export interface DealOutcome {
  outcome: 'open' | 'won' | 'lost' | 'on_hold' | 'cancelled';
  wonDate?: string;
  finalSolution?: string;
  finalNotes?: string;
  handoverStatus?: string;
  lostDate?: string;
  lostReason?: string;
  competitor?: string;
  commercialReason?: string;
  technicalReason?: string;
  clientReason?: string;
  lessonsLearned?: string;
  notes?: string;
}

export interface Opportunity {
  id: string;
  code: string;
  name: string;
  clientName: string;
  clientIndustry: 'FinTech / Banking' | 'Healthcare / Life Sciences' | 'E-Commerce / Retail' | 'Enterprise SaaS' | 'Telecom / 5G' | 'Manufacturing & IoT' | 'Public Sector' | 'Energy / Utilities';
  clientLogo?: string;
  region: 'North America (US-East)' | 'North America (US-West)' | 'EMEA (London/Frankfurt)' | 'APAC (Singapore/Tokyo)' | 'LATAM';
  stage: OpportunityStage;
  priority: DealPriority;
  dealComplexity: DealComplexity;
  technicalFitScore: TechnicalFitScore;
  primaryTechStack: CloudProvider;
  technologies: string[];
  // Section 5: selected multi-select scopes from the managed catalog
  scopes?: string[];
  
  // Commercials
  contractValue: number;
  arr: number;
  winProbability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;

  // Owners
  leadSolutionArchitect: string;
  leadArchitectAvatar?: string;
  accountExecutive: string;
  presalesEngineerSecondary?: string;
  supportingPresalesEngineers?: string[];

  // Technical Scope
  currentLegacyStack: string;
  proposedArchitecture: string;
  keyTechnicalRequirements: string[];
  complianceRequirements: ('SOC2 Type II' | 'HIPAA' | 'PCI-DSS' | 'ISO 27001' | 'FedRAMP' | 'GDPR')[];
  securityReviewStatus: 'Not Started' | 'In Review' | 'Exceptions Approved' | 'Cleared';

  // Sub-modules
  activities: PresalesActivity[];
  stakeholders: Stakeholder[];
  documents?: OpportunityDocument[];
  poc: POCDetails;
  boq: BOQSummary;
  actionItems: ActionItem[];
  handover: HandoverDetails;

  // Section 15/16: Tender & Deal Outcome
  tender?: TenderInfo;
  outcome?: DealOutcome;

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string;
  daysInCurrentStage: number;
}

export interface PresalesEngineer {
  id: string;
  name: string;
  email: string;
  title: string;
  avatar: string;
  skills: string[];
  activeDealsCount: number;
  totalPipelineValue: number;
  activePocCount: number;
  utilizationPercentage: number;
  certifications: string[];
}

export interface SalesKAM {
  id: string;
  name: string;
  email: string;
  region: string;
  accountsCount: number;
  quotaTarget: number;
  achievedPipeline: number;
  assignedLeadSA: string;
  avatar: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  code?: string;
  industry: Opportunity['clientIndustry'] | string;
  region?: string;
  domain?: string;
  tier: 'Strategic Global' | 'Enterprise Plus' | 'Mid-Market' | 'Growth' | 'Strategic Tier 1' | 'Enterprise Tier 2' | 'Commercial Tier 3' | string;
  totalActiveTCV?: number;
  totalContractedTCV?: number;
  annualRecurringRevenue?: number;
  activeOppsCount?: number;
  activeOpportunitiesCount?: number;
  leadSA?: string;
  assignedLeadSA?: string;
  assignedKAM?: string;
  assignedSalesKAM?: string;
  healthScore?: 'Healthy' | 'Needs Attention' | 'At Risk' | string;
  primaryTechStack: CloudProvider | string;
  joinedDate?: string;
  createdDate?: string;
  description?: string;
  headquarters?: string;
  notes?: string;
  keyStakeholders?: any[];
  bankRecords?: ClientBankRecord[];
}

export interface ClientBankRecord {
  'Subscriber ID': string;
  SLNO: string;
  'Branch Code': string;
  'Subscriber Name': string;
  'Branch Name': string;
  Category: string;
  Group: string;
  Address: string;
  CommisionDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'Discovery Session' | 'Architecture Workshop' | 'POC Milestone' | 'RFP Due Date' | 'Executive Demo' | 'Handover Kickoff' | string;
  date: string;
  time: string;
  opportunityCode: string;
  clientName: string;
  attendees: string[];
  location: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | string;
}

export interface CentralDocument {
  id: string;
  title: string;
  category: 'Reference Architecture' | 'RFP Answer Bank' | 'SOW Template' | 'Security Whitepaper' | 'Cost Estimation Guide' | 'OEM Sizing Guide' | 'sadd_template' | 'rfp_response' | 'security_whitepaper' | 'boq_calculator' | 'sow_standard' | 'case_study' | string;
  fileType: 'PDF' | 'DOCX' | 'PPTX' | 'XLSX' | 'ZIP' | 'PDF / Markdown' | string;
  size?: string;
  fileSize?: string;
  updatedAt?: string;
  lastUpdated?: string;
  author: string;
  downloadsCount?: number;
  downloadCount?: number;
  version?: string;
  clientName?: string;
  tags: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'sla_breach' | 'approval_required' | 'oem_update' | 'deal_assigned' | 'poc_milestone' | 'info' | string;
  timestamp: string;
  read: boolean;
  opportunityId?: string;
  opportunityCode?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor?: string;
  actorName?: string;
  actorRole: string;
  action: string;
  targetType?: 'Opportunity' | 'BOQ' | 'POC' | 'Security Signoff' | 'User Role' | 'System Config' | string;
  targetId?: string;
  targetName?: string;
  entityCode?: string;
  details: string;
  ipAddress: string;
  requestId?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Presales Lead / Architect' | 'Principal Solutions Architect' | 'Sales KAM' | 'Delivery Manager' | 'System Administrator' | 'presales_architect' | 'sales_kam' | 'presales_lead' | 'super_admin' | string;
  roleId?: string;
  department: 'Solutions Engineering' | 'Sales' | 'Delivery & Services' | 'Information Security' | 'Operations' | string;
  salesTeam?: string;
  status: 'Active' | 'Inactive' | 'Invited' | 'active' | 'inactive' | string;
  lastActive?: string;
  lastLoginAt?: string;
  mustChangePassword?: boolean;
  avatar?: string;
  region?: string;
  mfaEnabled?: boolean;
  createdAt?: string;
}

export interface RolePermission {
  id: string;
  name?: string;
  roleName?: string;
  description: string;
  usersCount: number;
  isSystemRole?: boolean;
  permissions: any;
}

// Scope / Solution Catalog entry (Section 5 of the master prompt). A managed,
// centrally-categorized multi-select taxonomy used to tag opportunities.
export interface ScopeCatalogEntry {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  status: 'Active' | 'Inactive' | string;
  sort_order: number;
}

export const SCOPE_CATEGORIES = [
  'NETWORK',
  'SECURITY',
  'SYSTEM',
  'STORAGE & BACKUP',
  'DATA CENTER',
  'SURVEILLANCE',
  'COLLABORATION & COMMUNICATION',
] as const;

// Section 10: OEM entry
export interface OEMEntry {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  status: 'Active' | 'Inactive' | string;
}

// Section 11: Product catalog entry linked to OEM
export interface ProductCatalogEntry {
  id: string;
  oem_id?: string | null;
  oem_name?: string | null;
  name: string;
  category: string;
  product_line?: string | null;
  model?: string | null;
  part_number?: string | null;
  description?: string | null;
  unit?: string | null;
  status: 'Active' | 'Inactive' | string;
}

export interface PresalesFilterState {
  searchQuery: string;
  stage: OpportunityStage | 'all';
  leadArchitect: string | 'all';
  primaryTechStack: CloudProvider | 'all';
  complexity: DealComplexity | 'all';
  region: string | 'all';
  priority: DealPriority | 'all';
  pocStatus: POCStatus | 'all';
  minContractValue?: number;
  maxContractValue?: number;
  hasOverdueActions: boolean;
  requiresHandover: boolean;
  sortBy: 'contractValue' | 'updatedAt' | 'expectedCloseDate' | 'winProbability' | 'daysInCurrentStage' | 'name';
  sortOrder: 'asc' | 'desc';
}

export type ActiveTab = 
  | 'dashboard'
  | 'opportunities'
  | 'board'
  | 'new_opportunity'
  | 'opportunity_detail'
  | 'calendar'
  | 'action_center'
  | 'clients'
  | 'client_details'
  | 'poc_center'
  | 'boq_workbench'
  | 'team_capacity'
  | 'sales_kam'
  | 'reports'
  | 'documents'
  | 'handover_queue'
  | 'notification_center'
  | 'scope_catalog'
  | 'oem_catalog'
  | 'product_catalog'
  | 'audit_logs'
  | 'user_management'
  | 'role_management'
  | 'master_config'
  | 'system_settings';

export type OpportunitySubView =
  | 'overview'
  | 'timeline'
  | 'tasks'
  | 'stakeholders'
  | 'documents'
  | 'boq'
  | 'technical'
  | 'sales'
  | 'implementation'
  | 'tender';
