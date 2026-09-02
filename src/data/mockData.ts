import { Opportunity, PresalesEngineer } from '../types';
import { DEFAULT_ROLES } from '../rbac';

export const INITIAL_ENGINEERS: PresalesEngineer[] = [
  {
    id: 'eng-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.internal',
    title: 'Principal Cloud Architect',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    skills: ['AWS', 'Kubernetes', 'Multi-Region High Availability', 'FinTech Security', 'Terraform'],
    activeDealsCount: 5,
    totalPipelineValue: 4250000,
    activePocCount: 2,
    utilizationPercentage: 88,
    certifications: ['AWS Solution Architect Pro', 'CKA', 'CISSP'],
  },
  {
    id: 'eng-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@enterprise.internal',
    title: 'Staff Enterprise Solutions Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skills: ['Google Cloud', 'AI / LLM Infra', 'BigQuery', 'Data Mesh', 'Vertex AI'],
    activeDealsCount: 4,
    totalPipelineValue: 3100000,
    activePocCount: 3,
    utilizationPercentage: 92,
    certifications: ['GCP Professional Cloud Architect', 'GCP Data Engineer'],
  },
  {
    id: 'eng-3',
    name: 'David Chen',
    email: 'david.chen@enterprise.internal',
    title: 'Senior Solutions Architect - Security & Compliance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skills: ['Azure', 'Zero-Trust Architecture', 'PCI-DSS', 'HIPAA', 'Entra ID'],
    activeDealsCount: 3,
    totalPipelineValue: 2450000,
    activePocCount: 1,
    utilizationPercentage: 72,
    certifications: ['Azure Solutions Architect Expert', 'CISM'],
  },
  {
    id: 'eng-4',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@enterprise.internal',
    title: 'Lead Presales Architect - Distributed Systems',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    skills: ['Hybrid / On-Prem', 'Kafka', 'Database Migrations', 'Edge Computing', 'Disaster Recovery'],
    activeDealsCount: 4,
    totalPipelineValue: 3800000,
    activePocCount: 2,
    utilizationPercentage: 80,
    certifications: ['AWS Pro Architect', 'Confluent Certified Kafka Developer'],
  },
  {
    id: 'eng-5',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@enterprise.internal',
    title: 'Solutions Engineer - Platform & DevSecOps',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skills: ['Kubernetes', 'CI/CD Pipelines', 'Observability', 'GitOps', 'ArgoCD'],
    activeDealsCount: 2,
    totalPipelineValue: 1600000,
    activePocCount: 1,
    utilizationPercentage: 60,
    certifications: ['CKS', 'HashiCorp Terraform Associate'],
  },
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-101',
    code: 'OPP-2024-8901',
    name: 'Core Banking API Modernization & Zero-Trust Mesh',
    clientName: 'Apex Global Bank NA',
    clientIndustry: 'FinTech / Banking',
    region: 'North America (US-East)',
    stage: 'proposal_boq',
    priority: 'p0_urgent',
    dealComplexity: 'critical',
    technicalFitScore: 'perfect',
    primaryTechStack: 'AWS',
    technologies: ['AWS EKS', 'Istio Service Mesh', 'HashiCorp Vault', 'DynamoDB Global Tables', 'AWS DirectConnect'],
    contractValue: 1250000,
    arr: 950000,
    winProbability: 85,
    expectedCloseDate: '2025-04-30',
    leadSolutionArchitect: 'Elena Rostova',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Robert Sterling',
    presalesEngineerSecondary: 'Tariq Al-Mansoor',
    currentLegacyStack: 'Mainframe IBM z15 backend with legacy F5 load balancers and monolithic Oracle RAC 19c on prem.',
    proposedArchitecture: 'Event-driven active-active hybrid mesh across AWS us-east-1 and us-east-2 connected via Direct Connect with 99.999% SLA uptime and mTLS end-to-end.',
    keyTechnicalRequirements: [
      'Sub-15ms p99 latency for payment transaction routing',
      'Dual-region automated failover without split-brain state',
      'FIPS 140-3 Level 3 HSM key management for transaction signing',
      'Immutable audit logging compliant with Basel III & PCI-DSS 4.0'
    ],
    complianceRequirements: ['SOC2 Type II', 'PCI-DSS', 'ISO 27001'],
    securityReviewStatus: 'Cleared',
    activities: [
      {
        id: 'act-1',
        type: 'Architectural Review',
        title: 'Executive Architecture Review with Chief Architect',
        timestamp: '2025-03-24T14:30:00Z',
        author: 'Elena Rostova',
        summary: 'Presented target state diagram for multi-region active-active VPC peering. Client requested formal latency verification in sandbox.',
        durationMinutes: 90,
        deliverables: ['Apex_Target_Architecture_v2.4.pdf', 'Disaster_Recovery_RTO_RPO_Analysis.xlsx'],
        attendees: ['Elena Rostova', 'Robert Sterling', 'Vikram Patel (Apex Chief Architect)', 'Claire Danvers (Head of Infrastructure)'],
        nextSteps: 'Provide final BOQ revision with 24x7 Mission Critical Support tier.'
      },
      {
        id: 'act-2',
        type: 'RFP / RFI Response',
        title: 'Completion of 148-Question Security Matrix',
        timestamp: '2025-03-18T10:00:00Z',
        author: 'David Chen',
        summary: 'Filled out Infosec Questionnaire including SOC2 Type II report validation, encryption at rest/in transit, and incident response runbooks.',
        durationMinutes: 240,
        deliverables: ['Apex_Security_Questionnaire_Approved.pdf'],
        attendees: ['David Chen', 'Elena Rostova', 'Markus Brandt (Apex CISO Lead)'],
        nextSteps: 'Formal Infosec sign-off acquired.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-1',
        name: 'Vikram Patel',
        role: 'Chief Enterprise Architect',
        department: 'Technology Office',
        email: 'vikram.patel@apexbank.com',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Technical Gatekeeper',
        notes: 'Highly enthusiastic about Kubernetes service mesh and latency savings. Direct line to CIO.',
        lastContactDate: '2025-03-24'
      },
      {
        id: 'stk-2',
        name: 'Claire Danvers',
        role: 'SVP of Infrastructure & Operations',
        department: 'IT Operations',
        email: 'claire.danvers@apexbank.com',
        influence: 'high',
        sentiment: 'supporter',
        buyingRole: 'Economic Buyer',
        notes: 'Focused on SLA guarantees and support tier pricing. Needs 15-minute response time SLA.',
        lastContactDate: '2025-03-22'
      },
      {
        id: 'stk-3',
        name: 'Marcus Vance-Security',
        role: 'Director of Information Security',
        department: 'Cyber Defense',
        email: 'marcus.security@apexbank.com',
        influence: 'medium',
        sentiment: 'neutral',
        buyingRole: 'Security Officer',
        notes: 'Requested pen test reports and HSM attestation docs.',
        lastContactDate: '2025-03-18'
      }
    ],
    poc: {
      status: 'passed',
      startDate: '2025-02-15',
      targetEndDate: '2025-03-15',
      actualEndDate: '2025-03-14',
      environmentUrl: 'https://poc-apex.enterprise-cloud.internal',
      awsAccountId: '8492-4910-3819',
      region: 'us-east-1 & us-east-2',
      allocatedBudget: 15000,
      successCriteria: [
        {
          id: 'sc-1',
          description: 'Sustain 12,000 TPS peak load with p99 latency < 14ms across both active regions',
          targetMetric: '< 15ms p99 @ 12k TPS',
          actualMetric: '11.8ms p99 @ 13.5k TPS',
          verified: true,
          verifiedByCustomer: 'Vikram Patel',
          category: 'Performance'
        },
        {
          id: 'sc-2',
          description: 'Simulated primary region blackout with zero data loss (RPO = 0, RTO < 30s)',
          targetMetric: 'RTO < 60s, RPO = 0',
          actualMetric: 'RTO = 18s, RPO = 0s',
          verified: true,
          verifiedByCustomer: 'Claire Danvers',
          category: 'Reliability'
        },
        {
          id: 'sc-3',
          description: 'Automated mTLS certificate rotation without connection resets',
          targetMetric: '0 dropped client sockets',
          actualMetric: '0 dropped sockets',
          verified: true,
          verifiedByCustomer: 'Marcus Vance-Security',
          category: 'Security'
        }
      ],
      blockers: [],
      customerSignOffDate: '2025-03-16',
      satisfactionScore: 5
    },
    boq: {
      items: [
        {
          id: 'b-1',
          category: 'Cloud Infrastructure',
          itemCode: 'INF-EKS-PRO',
          description: 'Managed Multi-Region Kubernetes Control Plane & Dedicated Worker Pools (64 vCPU / 256GB RAM)',
          unit: 'Instances/Mo',
          quantity: 36,
          unitCost: 850,
          unitListPrice: 1250,
          discountPercent: 12,
          extendedPrice: 475200,
          marginPercent: 28.5,
          notes: 'Year 1 commitment with reserved pricing model'
        },
        {
          id: 'b-2',
          category: 'Software Licenses',
          itemCode: 'LIC-SEC-ENTERPRISE',
          description: 'Enterprise Zero-Trust Security Mesh & Automated Vault Key Brokerage',
          unit: 'License/Yr',
          quantity: 1,
          unitCost: 120000,
          unitListPrice: 185000,
          discountPercent: 10,
          extendedPrice: 166500,
          marginPercent: 35.8
        },
        {
          id: 'b-3',
          category: 'Professional Services',
          itemCode: 'PS-MIGRATION-PK',
          description: 'Turnkey Hybrid Cloud Migration, Architecture Verification & Load Testing Services',
          unit: 'Man-Days',
          quantity: 120,
          unitCost: 1400,
          unitListPrice: 2400,
          discountPercent: 15,
          extendedPrice: 244800,
          marginPercent: 38.2,
          notes: 'Includes 2 Principal SAs and 2 DevSecOps specialists for 90 days'
        },
        {
          id: 'b-4',
          category: 'Managed Support',
          itemCode: 'SUP-MISSION-CRITICAL',
          description: '24x7x365 Mission Critical Support with 15-min Sev-1 response and Dedicated TAM',
          unit: 'Flat Fee',
          quantity: 1,
          unitCost: 75000,
          unitListPrice: 135000,
          discountPercent: 0,
          extendedPrice: 135000,
          marginPercent: 44.4
        }
      ],
      subtotalCost: 651600,
      subtotalListPrice: 1115000,
      totalDiscountAmount: 93500,
      totalContractValue: 1021500,
      annualRecurringRevenue: 776700,
      oneTimeServicesValue: 244800,
      overallMarginPercent: 36.2,
      approvalStatus: 'approved',
      approvedBy: 'Jonathan Ross (VP Solutions Architecture)',
      approvedDate: '2025-03-22',
      version: 3
    },
    actionItems: [
      {
        id: 'act-item-1',
        title: 'Deliver final signed BOQ and SOW Addendum to Procurement',
        assignedTo: 'Elena Rostova',
        assignedToRole: 'Lead Solution Architect',
        dueDate: '2025-04-02',
        isCompleted: false,
        priority: 'p0_urgent',
        category: 'Legal / SOW',
        notes: 'Incorporate updated rate card for post-launch PS burst capacity.'
      },
      {
        id: 'act-item-2',
        title: 'Schedule Delivery Handover Alignment Call with PS Team Lead',
        assignedTo: 'Elena Rostova',
        assignedToRole: 'Lead Solution Architect',
        dueDate: '2025-04-05',
        isCompleted: false,
        priority: 'p1_high',
        category: 'Architecture',
        notes: 'Briefing for onboarding engineering squad.'
      }
    ],
    handover: {
      isHandedOver: false,
      technicalRunbookReady: true,
      credentialsSecurelyTransferred: false,
      customerTechKickoffScheduled: false,
      knownTechnicalDebtOrRisks: [
        'Apex internal firewall change freeze scheduled from April 15-20',
        'Legacy mainframe MQ channel requires dedicated tunnel encryption'
      ],
      specialSLAsAgreed: [
        'Quarterly failover drill simulation with enterprise architects',
        'Dedicated Named Technical Account Manager (TAM)'
      ]
    },
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-03-26T16:20:00Z',
    lastContactedAt: '2025-03-24T14:30:00Z',
    daysInCurrentStage: 6
  },
  {
    id: 'opp-102',
    code: 'OPP-2024-8914',
    name: 'Clinical AI Inference Pipeline & Genomics Data Lakehouse',
    clientName: 'Vertex Health Systems',
    clientIndustry: 'Healthcare / Life Sciences',
    region: 'North America (US-East)',
    stage: 'poc_demo',
    priority: 'p0_urgent',
    dealComplexity: 'critical',
    technicalFitScore: 'good',
    primaryTechStack: 'AI / LLM Infra',
    technologies: ['Google Cloud Vertex AI', 'NVIDIA H100 Clusters', 'BigQuery Omni', 'Cloud Healthcare API', 'Terraform'],
    contractValue: 2400000,
    arr: 1900000,
    winProbability: 70,
    expectedCloseDate: '2025-05-15',
    leadSolutionArchitect: 'Marcus Vance',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Samantha Miller',
    presalesEngineerSecondary: 'David Chen',
    currentLegacyStack: 'On-premise GPU clusters running Slurm with disconnected local NAS storage, causing 48-hour pipeline bottlenecks.',
    proposedArchitecture: 'Cloud-native scalable inference farm using Triton Inference Server on GKE with dedicated GPU autoscaling and automated HIPAA-compliant de-identification pipeline.',
    keyTechnicalRequirements: [
      'Strict HIPAA BAA compliance with zero data egress outside healthcare boundary',
      'Batch genomic analysis processing < 2 hours for 500GB sequenced FASTQ files',
      'Deterministic model reproducibility with MLflow registry and lineage tracking',
      'Federated learning support for external research hospital nodes'
    ],
    complianceRequirements: ['HIPAA', 'SOC2 Type II', 'ISO 27001'],
    securityReviewStatus: 'In Review',
    activities: [
      {
        id: 'act-3',
        type: 'Demo',
        title: 'Live GPU Inference Benchmark Demonstration',
        timestamp: '2025-03-25T11:00:00Z',
        author: 'Marcus Vance',
        summary: 'Demoed 8x NVIDIA H100 inference acceleration on pathology whole-slide images. Demonstrated 6.4x throughput over their current Slurm cluster.',
        durationMinutes: 75,
        deliverables: ['Vertex_Genomics_Benchmark_Report.pdf'],
        attendees: ['Marcus Vance', 'Samantha Miller', 'Dr. Aris Thorne (Chief Medical Data Officer)', 'Helen Zhao (Lead Bioinformatics Engineer)'],
        nextSteps: 'Activate Stage 2 of POC with real de-identified synthetic test datasets.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-4',
        name: 'Dr. Aris Thorne',
        role: 'Chief Medical Data Officer',
        department: 'Clinical Research',
        email: 'aris.thorne@vertexhealth.org',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Executive Sponsor',
        notes: 'Highly motivated to publish landmark cancer genomics paper powered by this infrastructure.',
        lastContactDate: '2025-03-25'
      },
      {
        id: 'stk-5',
        name: 'Helen Zhao',
        role: 'Lead Bioinformatics Engineer',
        department: 'Genomics Lab',
        email: 'helen.zhao@vertexhealth.org',
        influence: 'high',
        sentiment: 'supporter',
        buyingRole: 'Technical Gatekeeper',
        notes: 'Needs custom PyTorch CUDA container support and Python SDK compatibility.',
        lastContactDate: '2025-03-25'
      }
    ],
    poc: {
      status: 'active_testing',
      startDate: '2025-03-10',
      targetEndDate: '2025-04-10',
      environmentUrl: 'https://vertex-ai-poc.internal.cloud',
      region: 'us-central1',
      allocatedBudget: 28000,
      successCriteria: [
        {
          id: 'sc-4',
          description: 'Process 1,000 whole-exome sequencing jobs in under 90 minutes',
          targetMetric: '< 90 mins',
          actualMetric: '64 mins (In Progress)',
          verified: false,
          category: 'Performance'
        },
        {
          id: 'sc-5',
          description: 'Zero plaintext PHI/PII leakage in logs and telemetry pipelines',
          targetMetric: '100% automated redaction',
          actualMetric: 'Verified on 10k samples',
          verified: true,
          verifiedByCustomer: 'Helen Zhao',
          category: 'Security'
        }
      ],
      blockers: [
        {
          id: 'blk-1',
          description: 'Quota bottleneck on NVIDIA H100 reservation in us-central1-a',
          severity: 'blocking',
          openedAt: '2025-03-20',
          resolved: true,
          owner: 'Marcus Vance'
        }
      ]
    },
    boq: {
      items: [
        {
          id: 'b-5',
          category: 'Cloud Infrastructure',
          itemCode: 'INF-GPU-H100',
          description: 'Dedicated NVIDIA H100 80GB SXM5 GPU Node Reservation (16 Nodes)',
          unit: 'Core-Hrs',
          quantity: 115200,
          unitCost: 2.80,
          unitListPrice: 4.50,
          discountPercent: 18,
          extendedPrice: 425600,
          marginPercent: 24.1
        },
        {
          id: 'b-6',
          category: 'Software Licenses',
          itemCode: 'LIC-MLOPS-PLATFORM',
          description: 'Enterprise AI Orchestration & Healthcare Model Registry License',
          unit: 'Users/Yr',
          quantity: 80,
          unitCost: 1800,
          unitListPrice: 3200,
          discountPercent: 12,
          extendedPrice: 225280,
          marginPercent: 43.6
        }
      ],
      subtotalCost: 466400,
      subtotalListPrice: 774400,
      totalDiscountAmount: 123520,
      totalContractValue: 650880,
      annualRecurringRevenue: 650880,
      oneTimeServicesValue: 0,
      overallMarginPercent: 32.8,
      approvalStatus: 'pending_sa_lead',
      version: 2
    },
    actionItems: [
      {
        id: 'act-item-3',
        title: 'Resolve GPU multi-node NCCL interconnect bandwidth verification for customer',
        assignedTo: 'Marcus Vance',
        assignedToRole: 'Lead Solutions Architect',
        dueDate: '2025-03-29',
        isCompleted: false,
        priority: 'p0_urgent',
        category: 'POC Execution'
      },
      {
        id: 'act-item-4',
        title: 'Review HIPAA Business Associate Agreement (BAA) technical exhibit',
        assignedTo: 'David Chen',
        assignedToRole: 'Security Solutions Architect',
        dueDate: '2025-04-03',
        isCompleted: false,
        priority: 'p1_high',
        category: 'Security / Compliance'
      }
    ],
    handover: {
      isHandedOver: false,
      technicalRunbookReady: false,
      credentialsSecurelyTransferred: false,
      customerTechKickoffScheduled: false,
      knownTechnicalDebtOrRisks: [
        'Data ingestion pipeline relies on legacy customer FTP drops that need s3-compatible migration'
      ],
      specialSLAsAgreed: []
    },
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-03-26T14:10:00Z',
    lastContactedAt: '2025-03-25T11:00:00Z',
    daysInCurrentStage: 16
  },
  {
    id: 'opp-103',
    code: 'OPP-2024-8930',
    name: '5G Core Network Analytics & Low-Latency Edge Telemetry',
    clientName: 'NexaStream Telecom',
    clientIndustry: 'Telecom / 5G',
    region: 'EMEA (London/Frankfurt)',
    stage: 'tech_discovery',
    priority: 'p1_high',
    dealComplexity: 'high',
    technicalFitScore: 'good',
    primaryTechStack: 'Multi-Cloud',
    technologies: ['Apache Kafka', 'ClickHouse Cloud', 'Rust Telemetry Agents', 'eBPF', 'Grafana Enterprise'],
    contractValue: 1850000,
    arr: 1400000,
    winProbability: 50,
    expectedCloseDate: '2025-06-30',
    leadSolutionArchitect: 'Sarah Jenkins',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Julian Fox',
    presalesEngineerSecondary: 'Tariq Al-Mansoor',
    currentLegacyStack: 'Splunk on-premise cluster with surging license cost ($4M/yr) and inability to query raw cell tower metrics in real-time.',
    proposedArchitecture: 'Decoupled edge telemetry collectors using eBPF streaming into high-throughput Kafka clusters with ClickHouse storage tier yielding 85% TCO reduction.',
    keyTechnicalRequirements: [
      'Ingest 4.5 million network telemetry events per second across 12,000 cellular nodes',
      'Real-time anomaly detection alerts within 3 seconds of network degradation',
      'Support EU GDPR telecommunication metadata retention laws (90-day cold roll-off)',
      'Deployable on telco edge hardware (OpenShift and bare-metal RHEL)'
    ],
    complianceRequirements: ['GDPR', 'ISO 27001'],
    securityReviewStatus: 'In Review',
    activities: [
      {
        id: 'act-4',
        type: 'Discovery Call',
        title: 'Deep Dive on Cell Tower Ingestion Sizing',
        timestamp: '2025-03-21T15:00:00Z',
        author: 'Sarah Jenkins',
        summary: 'Clarified network topology across UK and Germany nodes. Identified peak bandwidth bursts during soccer matches.',
        durationMinutes: 60,
        deliverables: ['NexaStream_Ingestion_Math_Model.xlsx'],
        attendees: ['Sarah Jenkins', 'Julian Fox', 'Liam Gallagher (VP Network Operations)'],
        nextSteps: 'Create customized BOQ comparison showing Splunk replacement ROI.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-6',
        name: 'Liam Gallagher',
        role: 'VP Network Operations & Engineering',
        department: 'Core Networks',
        email: 'liam.g@nexastream.co.uk',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Economic Buyer',
        notes: 'Under strict CFO mandate to cut Splunk licensing costs by 60% this fiscal year.',
        lastContactDate: '2025-03-21'
      }
    ],
    poc: {
      status: 'scoping',
      allocatedBudget: 12000,
      successCriteria: [
        {
          id: 'sc-6',
          description: 'Simulate 2M events/sec load test with sub-2s query latency over 30 days of data',
          targetMetric: '< 2.0s query p95',
          verified: false,
          category: 'Performance'
        }
      ],
      blockers: []
    },
    boq: {
      items: [],
      subtotalCost: 0,
      subtotalListPrice: 0,
      totalDiscountAmount: 0,
      totalContractValue: 0,
      annualRecurringRevenue: 0,
      oneTimeServicesValue: 0,
      overallMarginPercent: 0,
      approvalStatus: 'draft',
      version: 1
    },
    actionItems: [
      {
        id: 'act-item-5',
        title: 'Produce eBPF edge collector sizing paper for NexaStream architect committee',
        assignedTo: 'Sarah Jenkins',
        assignedToRole: 'Lead Presales Architect',
        dueDate: '2025-04-04',
        isCompleted: false,
        priority: 'p1_high',
        category: 'Architecture'
      }
    ],
    handover: {
      isHandedOver: false,
      technicalRunbookReady: false,
      credentialsSecurelyTransferred: false,
      customerTechKickoffScheduled: false,
      knownTechnicalDebtOrRisks: [],
      specialSLAsAgreed: []
    },
    createdAt: '2025-02-20T11:00:00Z',
    updatedAt: '2025-03-25T17:00:00Z',
    lastContactedAt: '2025-03-21T15:00:00Z',
    daysInCurrentStage: 12
  },
  {
    id: 'opp-104',
    code: 'OPP-2024-8942',
    name: 'Unified Global Logistics & Real-time Supply Chain Digital Twin',
    clientName: 'Orion Cloud Logistics',
    clientIndustry: 'Enterprise SaaS',
    region: 'APAC (Singapore/Tokyo)',
    stage: 'commercial_negotiation',
    priority: 'p1_high',
    dealComplexity: 'high',
    technicalFitScore: 'perfect',
    primaryTechStack: 'Kubernetes',
    technologies: ['Azure AKS', 'Azure Cosmos DB', 'Temporal.io', 'Redis Enterprise', 'Kong Enterprise Gateway'],
    contractValue: 980000,
    arr: 820000,
    winProbability: 90,
    expectedCloseDate: '2025-04-15',
    leadSolutionArchitect: 'David Chen',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Wei Zhang',
    presalesEngineerSecondary: 'Elena Rostova',
    currentLegacyStack: 'Fragmented country-specific AWS accounts and custom PHP cron jobs failing on inventory synchronization.',
    proposedArchitecture: 'Event-driven multi-tenant orchestration using Temporal.io workflows on Azure AKS with multi-region replication in Singapore and Tokyo.',
    keyTechnicalRequirements: [
      'Global inventory locking consistency across 400 fulfillment centers',
      'Support containerized edge deployments in container vessels with intermittent connectivity',
      'Integration with SAP S/4HANA ERP via enterprise certified connectors'
    ],
    complianceRequirements: ['SOC2 Type II', 'ISO 27001'],
    securityReviewStatus: 'Cleared',
    activities: [
      {
        id: 'act-5',
        type: 'BOQ Review',
        title: 'Final Technical Commercial Alignment with APAC Procurement',
        timestamp: '2025-03-23T08:30:00Z',
        author: 'David Chen',
        summary: 'Finalized enterprise discount tier based on 3-year upfront commitment. Signed off on Azure Reserved Instance schedule.',
        durationMinutes: 45,
        deliverables: ['Orion_Final_Commercial_SOW_v3.pdf'],
        attendees: ['David Chen', 'Wei Zhang', 'Kenji Sato (Director of Procurement)', 'Min-Jun Park (CTO)'],
        nextSteps: 'Hand off to delivery team upon master contract execution.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-7',
        name: 'Min-Jun Park',
        role: 'Chief Technology Officer',
        department: 'Engineering',
        email: 'm.park@orionlogistics.io',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Economic Buyer',
        notes: 'Signed off on architectural blueprint. Ready to transition.',
        lastContactDate: '2025-03-23'
      }
    ],
    poc: {
      status: 'passed',
      startDate: '2025-01-15',
      targetEndDate: '2025-02-28',
      actualEndDate: '2025-02-25',
      environmentUrl: 'https://orion-poc.southeastasia.cloud',
      allocatedBudget: 10000,
      successCriteria: [
        {
          id: 'sc-7',
          description: 'Orchestrate 50,000 parallel fulfillment workflows without state loss',
          targetMetric: '100% workflow idempotency',
          actualMetric: '100% verified on 100k test runs',
          verified: true,
          verifiedByCustomer: 'Min-Jun Park',
          category: 'Reliability'
        }
      ],
      blockers: [],
      customerSignOffDate: '2025-03-01',
      satisfactionScore: 5
    },
    boq: {
      items: [
        {
          id: 'b-7',
          category: 'Cloud Infrastructure',
          itemCode: 'INF-AKS-ENT',
          description: 'Azure Managed AKS Production Clusters (APAC East & Southeast)',
          unit: 'Instances/Mo',
          quantity: 24,
          unitCost: 650,
          unitListPrice: 950,
          discountPercent: 15,
          extendedPrice: 232560,
          marginPercent: 32.5
        },
        {
          id: 'b-8',
          category: 'Professional Services',
          itemCode: 'PS-INTEGRATION-SAP',
          description: 'SAP S/4HANA Middleware Connector & Data Pipeline Implementation',
          unit: 'Man-Days',
          quantity: 60,
          unitCost: 1200,
          unitListPrice: 2100,
          discountPercent: 10,
          extendedPrice: 113400,
          marginPercent: 42.8
        }
      ],
      subtotalCost: 259200,
      subtotalListPrice: 399600,
      totalDiscountAmount: 53640,
      totalContractValue: 345960,
      annualRecurringRevenue: 232560,
      oneTimeServicesValue: 113400,
      overallMarginPercent: 35.8,
      approvalStatus: 'approved',
      approvedBy: 'Jonathan Ross (VP Solutions Architecture)',
      approvedDate: '2025-03-20',
      version: 4
    },
    actionItems: [
      {
        id: 'act-item-6',
        title: 'Prepare Delivery Handover Package & Technical Runbook',
        assignedTo: 'David Chen',
        assignedToRole: 'Lead Solution Architect',
        dueDate: '2025-04-10',
        isCompleted: false,
        priority: 'p1_high',
        category: 'Architecture'
      }
    ],
    handover: {
      isHandedOver: false,
      technicalRunbookReady: true,
      credentialsSecurelyTransferred: false,
      customerTechKickoffScheduled: true,
      kickoffDate: '2025-04-22',
      assignedDeliveryLead: 'Rajesh Subramaniam',
      assignedCustomerSuccessManager: 'Chloe Bennet',
      knownTechnicalDebtOrRisks: [
        'Customer SAP instance is on-premise in Singapore datacenter and requires IPsec tunnel setup'
      ],
      specialSLAsAgreed: [
        'APAC business hours 15-minute response time SLA'
      ]
    },
    createdAt: '2024-12-05T09:00:00Z',
    updatedAt: '2025-03-26T10:00:00Z',
    lastContactedAt: '2025-03-23T08:30:00Z',
    daysInCurrentStage: 5
  },
  {
    id: 'opp-105',
    code: 'OPP-2024-8955',
    name: 'Autonomous Vision & Edge Robotics Fleet Control',
    clientName: 'Quantum AI Robotics',
    clientIndustry: 'Manufacturing & IoT',
    region: 'North America (US-West)',
    stage: 'closed_won',
    priority: 'p1_high',
    dealComplexity: 'high',
    technicalFitScore: 'perfect',
    primaryTechStack: 'Hybrid / On-Prem',
    technologies: ['ROS2', 'NVIDIA Jetson Edge', 'Kubernetes K3s', 'MQTT Sparkplug B', 'AWS Greengrass'],
    contractValue: 1650000,
    arr: 1200000,
    winProbability: 100,
    expectedCloseDate: '2025-03-15',
    actualCloseDate: '2025-03-15',
    leadSolutionArchitect: 'Tariq Al-Mansoor',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Jessica Blake',
    currentLegacyStack: 'Custom homegrown C++ daemon running without container orchestration on factory floor.',
    proposedArchitecture: 'Lightweight K3s on Jetson hardware with centralized OTA firmware deployment and cloud telemetry sync.',
    keyTechnicalRequirements: [
      'Over-the-air firmware updates with automatic rollback on checksum mismatch',
      'Deterministic latency < 5ms for robotic collision avoidance signals',
      'Air-gapped factory operation resilience for up to 72 hours'
    ],
    complianceRequirements: ['ISO 27001', 'SOC2 Type II'],
    securityReviewStatus: 'Cleared',
    activities: [
      {
        id: 'act-6',
        type: 'Whiteboarding',
        title: 'Final Implementation Kickoff & Technical Handover Meeting',
        timestamp: '2025-03-24T16:00:00Z',
        author: 'Tariq Al-Mansoor',
        summary: 'Transferred all architecture blueprints, Terraform scripts, and ROS2 manifests to PS Delivery Lead.',
        durationMinutes: 120,
        deliverables: ['Quantum_Handover_Packet_v1.0.zip', 'Architecture_Runbook.pdf'],
        attendees: ['Tariq Al-Mansoor', 'Jessica Blake', 'Mateo Rossi (Lead Robotics Architect)', 'Siddharth Nair (Delivery Lead)'],
        nextSteps: 'Delivery team conducts factory floor deployment in San Jose.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-8',
        name: 'Mateo Rossi',
        role: 'VP of Robotics Platform',
        department: 'Autonomous Systems',
        email: 'mateo.rossi@quantumrobotics.ai',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Economic Buyer',
        notes: 'Thrilled with POC results and edge deployment speed.',
        lastContactDate: '2025-03-24'
      }
    ],
    poc: {
      status: 'passed',
      startDate: '2025-01-10',
      actualEndDate: '2025-02-28',
      allocatedBudget: 15000,
      successCriteria: [
        {
          id: 'sc-8',
          description: 'Zero-downtime OTA update across 50 simulated robot nodes',
          targetMetric: '100% update success',
          actualMetric: '100% verified',
          verified: true,
          category: 'Reliability'
        }
      ],
      blockers: [],
      customerSignOffDate: '2025-03-01',
      satisfactionScore: 5
    },
    boq: {
      items: [
        {
          id: 'b-9',
          category: 'Software Licenses',
          itemCode: 'LIC-EDGE-FLEET',
          description: 'Fleet Management Platform License for 2,500 Edge Devices',
          unit: 'Users/Yr',
          quantity: 2500,
          unitCost: 150,
          unitListPrice: 280,
          discountPercent: 15,
          extendedPrice: 595000,
          marginPercent: 46.4
        }
      ],
      subtotalCost: 375000,
      subtotalListPrice: 700000,
      totalDiscountAmount: 105000,
      totalContractValue: 595000,
      annualRecurringRevenue: 595000,
      oneTimeServicesValue: 0,
      overallMarginPercent: 46.4,
      approvalStatus: 'approved',
      approvedBy: 'Jonathan Ross (VP Solutions Architecture)',
      approvedDate: '2025-03-10',
      version: 2
    },
    actionItems: [
      {
        id: 'act-item-7',
        title: 'Sign off on final Delivery Handover Checklist',
        assignedTo: 'Tariq Al-Mansoor',
        assignedToRole: 'Solutions Engineer',
        dueDate: '2025-03-28',
        isCompleted: true,
        priority: 'p1_high',
        category: 'Architecture'
      }
    ],
    handover: {
      isHandedOver: true,
      handoverDate: '2025-03-24',
      assignedDeliveryLead: 'Siddharth Nair',
      assignedCustomerSuccessManager: 'Danielle Cooper',
      architectureDiagramUrl: 'https://docs.enterprise.internal/arch/quantum-robotics-v1',
      technicalRunbookReady: true,
      credentialsSecurelyTransferred: true,
      customerTechKickoffScheduled: true,
      kickoffDate: '2025-04-01',
      knownTechnicalDebtOrRisks: [
        'Customer factory network has intermittent Wi-Fi coverage on Bay 4'
      ],
      specialSLAsAgreed: [
        'Dedicated hotline for factory line stoppages'
      ]
    },
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2025-03-24T16:30:00Z',
    lastContactedAt: '2025-03-24T16:00:00Z',
    daysInCurrentStage: 12
  },
  {
    id: 'opp-106',
    code: 'OPP-2024-8968',
    name: 'Omnichannel Real-Time Inventory & Checkout Engine',
    clientName: 'OmniRetail Brands',
    clientIndustry: 'E-Commerce / Retail',
    region: 'North America (US-East)',
    stage: 'solution_design',
    priority: 'p2_medium',
    dealComplexity: 'medium',
    technicalFitScore: 'good',
    primaryTechStack: 'AWS',
    technologies: ['AWS Aurora Serverless', 'Redis Enterprise', 'GraphQL Mesh', 'Node.js Microservices'],
    contractValue: 750000,
    arr: 600000,
    winProbability: 60,
    expectedCloseDate: '2025-06-15',
    leadSolutionArchitect: 'Elena Rostova',
    leadArchitectAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accountExecutive: 'Robert Sterling',
    currentLegacyStack: 'Monolithic Magento 2 on AWS EC2 instances that crashes during Black Friday traffic spikes.',
    proposedArchitecture: 'Composable headless commerce backend with Aurora Serverless v2 database cluster and edge caching for sub-second checkout.',
    keyTechnicalRequirements: [
      'Scale from 500 to 25,000 checkouts/min in under 90 seconds without manual provisioning',
      'Inventory synchronization with 850 brick-and-mortar stores in real time',
      'PCI-DSS Level 1 compliance for hosted tokenization fields'
    ],
    complianceRequirements: ['PCI-DSS', 'SOC2 Type II'],
    securityReviewStatus: 'Cleared',
    activities: [
      {
        id: 'act-7',
        type: 'Discovery Call',
        title: 'E-Commerce Peak Season Architecture Scoping',
        timestamp: '2025-03-22T13:00:00Z',
        author: 'Elena Rostova',
        summary: 'Reviewed previous Black Friday outage logs. Identified database connection pooling as single point of failure.',
        durationMinutes: 60,
        deliverables: ['OmniRetail_Discovery_Report_v1.pdf'],
        attendees: ['Elena Rostova', 'Robert Sterling', 'Gary Lin (VP Engineering)'],
        nextSteps: 'Deliver Target Solution Architecture proposal.'
      }
    ],
    stakeholders: [
      {
        id: 'stk-9',
        name: 'Gary Lin',
        role: 'VP of Digital Engineering',
        department: 'E-Commerce',
        email: 'gary.lin@omniretail.com',
        influence: 'high',
        sentiment: 'champion',
        buyingRole: 'Technical Gatekeeper',
        notes: 'Determined to avoid another Black Friday crash.',
        lastContactDate: '2025-03-22'
      }
    ],
    poc: {
      status: 'scoping',
      allocatedBudget: 8000,
      successCriteria: [],
      blockers: []
    },
    boq: {
      items: [],
      subtotalCost: 0,
      subtotalListPrice: 0,
      totalDiscountAmount: 0,
      totalContractValue: 0,
      annualRecurringRevenue: 0,
      oneTimeServicesValue: 0,
      overallMarginPercent: 0,
      approvalStatus: 'draft',
      version: 1
    },
    actionItems: [
      {
        id: 'act-item-8',
        title: 'Draft Solution Architecture Design Document (SADD)',
        assignedTo: 'Elena Rostova',
        assignedToRole: 'Lead Solution Architect',
        dueDate: '2025-04-08',
        isCompleted: false,
        priority: 'p1_high',
        category: 'Architecture'
      }
    ],
    handover: {
      isHandedOver: false,
      technicalRunbookReady: false,
      credentialsSecurelyTransferred: false,
      customerTechKickoffScheduled: false,
      knownTechnicalDebtOrRisks: [],
      specialSLAsAgreed: []
    },
    createdAt: '2025-02-18T09:00:00Z',
    updatedAt: '2025-03-24T11:00:00Z',
    lastContactedAt: '2025-03-22T13:00:00Z',
    daysInCurrentStage: 8
  }
];

export const STAGE_CONFIG: Record<string, { label: string; shortLabel: string; color: string; bg: string; borderColor: string; description: string }> = {
  qualification: {
    label: '1. Technical Qualification',
    shortLabel: 'Qualification',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: 'Initial intake, technical feasibility scoring, BANT qualification'
  },
  tech_discovery: {
    label: '2. Technical Discovery',
    shortLabel: 'Discovery',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: 'Architecture deep-dive, pain points, compliance & legacy stack audit'
  },
  solution_design: {
    label: '3. Solution Architecture',
    shortLabel: 'Solution Design',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Target state diagrams, sizing models, integration feasibility specs'
  },
  poc_demo: {
    label: '4. POC & Technical Validation',
    shortLabel: 'POC / Demo',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Live lab benchmarks, customer KPI validation, blocker resolution'
  },
  proposal_boq: {
    label: '5. Proposal & BOQ Sizing',
    shortLabel: 'Proposal / BOQ',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Bill of Quantities pricing, margin governance, SOW generation'
  },
  commercial_negotiation: {
    label: '6. Commercial & Security Signoff',
    shortLabel: 'Negotiation',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: 'InfoSec clearance, MSA review, executive approval gate'
  },
  closed_won: {
    label: '7. Closed Won (Handover)',
    shortLabel: 'Won / Handover',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Technical knowledge transfer to Delivery / Professional Services'
  },
  closed_lost: {
    label: '8. Closed Lost',
    shortLabel: 'Closed Lost',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Technical post-mortem, lost reason, competitor analysis'
  }
};

export const MOCK_CLIENTS = [
  {
    id: 'cli-001',
    name: 'Apex Global Financial Corp',
    industry: 'FinTech / Banking' as const,
    region: 'North America (US-East)',
    tier: 'Strategic Global' as const,
    totalActiveTCV: 2450000,
    annualRecurringRevenue: 980000,
    activeOppsCount: 2,
    leadSA: 'Dr. Marcus Vance',
    assignedKAM: 'Rachel Sterling',
    healthScore: 'Healthy' as const,
    primaryTechStack: 'AWS' as const,
    joinedDate: '2022-04-12',
    description: 'Tier-1 investment banking and clearing house operating high-frequency settlement networks.'
  },
  {
    id: 'cli-002',
    name: 'OmniHealth BioSystems',
    industry: 'Healthcare / Life Sciences' as const,
    region: 'North America (US-West)',
    tier: 'Enterprise Plus' as const,
    totalActiveTCV: 1850000,
    annualRecurringRevenue: 720000,
    activeOppsCount: 1,
    leadSA: 'Elena Rostova',
    assignedKAM: 'Michael Torres',
    healthScore: 'Needs Attention' as const,
    primaryTechStack: 'Google Cloud' as const,
    joinedDate: '2023-01-19',
    description: 'Genomic data pipeline processing 40TB/day with stringent HIPAA and FHIR compliance protocols.'
  },
  {
    id: 'cli-003',
    name: 'Nordic Retail Group',
    industry: 'E-Commerce / Retail' as const,
    region: 'EMEA (London/Frankfurt)',
    tier: 'Strategic Global' as const,
    totalActiveTCV: 3100000,
    annualRecurringRevenue: 1250000,
    activeOppsCount: 3,
    leadSA: 'Vikram Mehta',
    assignedKAM: 'David Chen',
    healthScore: 'Healthy' as const,
    primaryTechStack: 'Azure' as const,
    joinedDate: '2021-08-30',
    description: 'Pan-European omnichannel marketplace operating 4,200 retail endpoints and real-time inventory cluster.'
  },
  {
    id: 'cli-004',
    name: 'Aether Cloud Communications',
    industry: 'Telecom / 5G' as const,
    region: 'APAC (Singapore/Tokyo)',
    tier: 'Enterprise Plus' as const,
    totalActiveTCV: 920000,
    annualRecurringRevenue: 380000,
    activeOppsCount: 1,
    leadSA: 'Sarah Jenkins',
    assignedKAM: 'Sophia Al-Mansoor',
    healthScore: 'Healthy' as const,
    primaryTechStack: 'Kubernetes' as const,
    joinedDate: '2023-11-05',
    description: '5G Edge routing and VoIP telecommunication provider serving telco carriers across SEA.'
  },
  {
    id: 'cli-005',
    name: 'CyberGrid Smart Utilities',
    industry: 'Energy / Utilities' as const,
    region: 'North America (US-East)',
    tier: 'Mid-Market' as const,
    totalActiveTCV: 640000,
    annualRecurringRevenue: 260000,
    activeOppsCount: 1,
    leadSA: 'Dr. Marcus Vance',
    assignedKAM: 'Rachel Sterling',
    healthScore: 'At Risk' as const,
    primaryTechStack: 'Hybrid / On-Prem' as const,
    joinedDate: '2024-02-14',
    description: 'Grid telemetry and SCADA infrastructure management with zero-trust edge security.'
  }
];

export const MOCK_SALES_KAMS = [
  {
    id: 'kam-001',
    name: 'Rachel Sterling',
    email: 'rachel.sterling@presaleshq.io',
    region: 'North America (US-East)',
    accountsCount: 8,
    quotaTarget: 5000000,
    achievedPipeline: 4120000,
    assignedLeadSA: 'Dr. Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'kam-002',
    name: 'Michael Torres',
    email: 'm.torres@presaleshq.io',
    region: 'North America (US-West)',
    accountsCount: 6,
    quotaTarget: 4000000,
    achievedPipeline: 3450000,
    assignedLeadSA: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'kam-003',
    name: 'David Chen',
    email: 'david.chen@presaleshq.io',
    region: 'EMEA (London/Frankfurt)',
    accountsCount: 11,
    quotaTarget: 6000000,
    achievedPipeline: 5800000,
    assignedLeadSA: 'Vikram Mehta',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'kam-004',
    name: 'Sophia Al-Mansoor',
    email: 'sophia.m@presaleshq.io',
    region: 'APAC (Singapore/Tokyo)',
    accountsCount: 7,
    quotaTarget: 3500000,
    achievedPipeline: 2900000,
    assignedLeadSA: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  }
];

export const MOCK_CALENDAR_EVENTS = [
  {
    id: 'cal-001',
    title: 'Kafka vs Kinesis Architecture Workshop',
    type: 'Architecture Workshop' as const,
    date: '2025-04-03',
    time: '10:00 AM - 11:30 AM EST',
    opportunityCode: 'OPP-2024-819',
    clientName: 'Apex Global Financial Corp',
    attendees: ['Dr. Marcus Vance', 'David Sterling (CTO)', 'Arthur Pendelton (SecOps)'],
    location: 'Virtual (Teams + Miro Live)',
    status: 'Confirmed' as const
  },
  {
    id: 'cal-002',
    title: 'HIPAA GenAI Validation & Benchmark Gate',
    type: 'POC Milestone' as const,
    date: '2025-04-04',
    time: '02:00 PM - 03:30 PM PST',
    opportunityCode: 'OPP-2024-942',
    clientName: 'OmniHealth BioSystems',
    attendees: ['Elena Rostova', 'Dr. Patricia Hall (VP AI)', 'Michael Torres'],
    location: 'OmniHealth HQ (San Francisco & Zoom)',
    status: 'Confirmed' as const
  },
  {
    id: 'cal-003',
    title: 'Formal BOQ & Commercial Review with VP Sales',
    type: 'Executive Demo' as const,
    date: '2025-04-07',
    time: '09:00 AM - 10:00 AM CET',
    opportunityCode: 'OPP-2024-521',
    clientName: 'Nordic Retail Group',
    attendees: ['Vikram Mehta', 'David Chen', 'Gunnar Lindqvist (Procurement)'],
    location: 'Executive Briefing Center / Video',
    status: 'Confirmed' as const
  },
  {
    id: 'cal-004',
    title: 'Technical Delivery Handover & Runbook Signoff',
    type: 'Handover Kickoff' as const,
    date: '2025-04-09',
    time: '01:00 PM - 02:30 PM EST',
    opportunityCode: 'OPP-2024-819',
    clientName: 'Apex Global Financial Corp',
    attendees: ['Dr. Marcus Vance', 'Carlos Mendez (PS Lead)', 'Rachel Sterling'],
    location: 'Room 402 + Zoom',
    status: 'Pending' as const
  },
  {
    id: 'cal-005',
    title: 'GovCloud RFP Final Submission Deadline',
    type: 'RFP Due Date' as const,
    date: '2025-04-11',
    time: '05:00 PM EST',
    opportunityCode: 'OPP-2024-604',
    clientName: 'Federal Logistics Agency',
    attendees: ['Sarah Jenkins', 'Compliance Team', 'VP Public Sector'],
    location: 'SAM.gov Portal Submission',
    status: 'Confirmed' as const
  }
];

export const MOCK_CENTRAL_DOCUMENTS = [
  {
    id: 'cdoc-001',
    title: 'AWS Enterprise Multi-Account Landing Zone v4.2 Blueprint',
    category: 'Reference Architecture' as const,
    fileType: 'PDF' as const,
    size: '14.2 MB',
    updatedAt: '2025-03-20',
    author: 'Dr. Marcus Vance',
    downloadsCount: 148,
    tags: ['AWS', 'Control Tower', 'Transit Gateway', 'Security Hub']
  },
  {
    id: 'cdoc-002',
    title: 'Standard FinTech SOC2 & PCI-DSS Technical Response Bank 2025',
    category: 'RFP Answer Bank' as const,
    fileType: 'DOCX' as const,
    size: '4.8 MB',
    updatedAt: '2025-03-15',
    author: 'Sarah Jenkins',
    downloadsCount: 312,
    tags: ['InfoSec', 'PCI-DSS v4.0', 'SOC2 Type II', 'PenTest']
  },
  {
    id: 'cdoc-003',
    title: 'Kubernetes Multi-Cluster DR & Service Mesh SOW Template',
    category: 'SOW Template' as const,
    fileType: 'DOCX' as const,
    size: '2.1 MB',
    updatedAt: '2025-02-28',
    author: 'Vikram Mehta',
    downloadsCount: 89,
    tags: ['Kubernetes', 'Istio', 'EKS', 'SOW']
  },
  {
    id: 'cdoc-004',
    title: 'GCP Healthcare API & FHIR Data Harmonization Sizing Matrix',
    category: 'OEM Sizing Guide' as const,
    fileType: 'XLSX' as const,
    size: '6.4 MB',
    updatedAt: '2025-03-10',
    author: 'Elena Rostova',
    downloadsCount: 64,
    tags: ['Google Cloud', 'Healthcare', 'FHIR', 'BigQuery']
  },
  {
    id: 'cdoc-005',
    title: 'Zero-Trust Bastionless Teleport vs AWS Client VPN Whitepaper',
    category: 'Security Whitepaper' as const,
    fileType: 'PDF' as const,
    size: '3.7 MB',
    updatedAt: '2025-01-22',
    author: 'Dr. Marcus Vance',
    downloadsCount: 195,
    tags: ['Zero Trust', 'Identity', 'SSO', 'Okta']
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    title: 'SLA Breach Warning: BOQ Approval Expiring',
    message: 'OmniHealth BioSystems (OPP-2024-942) BOQ discount (16%) is awaiting VP Sales clearance for >48 hours.',
    type: 'sla_breach' as const,
    timestamp: '10 mins ago',
    read: false,
    opportunityId: 'opp-2',
    opportunityCode: 'OPP-2024-942'
  },
  {
    id: 'notif-002',
    title: 'POC Milestone Passed: 45,000 msg/sec Benchmark',
    message: 'Apex Global Financial validation verified by customer engineering team.',
    type: 'poc_milestone' as const,
    timestamp: '2 hours ago',
    read: false,
    opportunityId: 'opp-1',
    opportunityCode: 'OPP-2024-819'
  },
  {
    id: 'notif-003',
    title: 'New High-Value Opportunity Assigned',
    message: 'Nordic Retail Group Core Cloud Modernization ($3.1M TCV) assigned to Vikram Mehta.',
    type: 'deal_assigned' as const,
    timestamp: '5 hours ago',
    read: true,
    opportunityId: 'opp-3',
    opportunityCode: 'OPP-2024-521'
  },
  {
    id: 'notif-004',
    title: 'OEM Price Revision Notification: AWS EKS Fargate',
    message: 'AWS published updated Q2 list prices for us-east-1 and eu-central-1 clusters.',
    type: 'oem_update' as const,
    timestamp: '1 day ago',
    read: true
  }
];

export const MOCK_AUDIT_LOGS = [
  {
    id: 'audit-001',
    timestamp: '2025-03-24 14:32:10 UTC',
    actor: 'Dr. Marcus Vance',
    actorRole: 'Lead Solution Architect',
    action: 'BOQ_DISCOUNT_MODIFIED',
    targetType: 'BOQ' as const,
    targetId: 'boq-opp-1-v2',
    targetName: 'Apex Financial BOQ Sizing v2',
    details: 'Adjusted EKS node group discount from 10% to 15% to match annual enterprise commitment tier.',
    ipAddress: '192.168.10.42'
  },
  {
    id: 'audit-002',
    timestamp: '2025-03-24 11:15:00 UTC',
    actor: 'Rachel Sterling',
    actorRole: 'Sales KAM',
    action: 'STAGE_TRANSITION_PROMOTED',
    targetType: 'Opportunity' as const,
    targetId: 'opp-1',
    targetName: 'Apex Global Financial (OPP-2024-819)',
    details: 'Moved deal stage from Proposal & BOQ Sizing to Commercial Negotiation.',
    ipAddress: '192.168.10.19'
  },
  {
    id: 'audit-003',
    timestamp: '2025-03-23 16:45:22 UTC',
    actor: 'Sarah Jenkins',
    actorRole: 'Senior Security Architect',
    action: 'SECURITY_REVIEW_CLEARED',
    targetType: 'Security Signoff' as const,
    targetId: 'sec-opp-3',
    targetName: 'Nordic Retail Group (OPP-2024-521)',
    details: 'Cleared GDPR multi-region encryption key management architecture exception.',
    ipAddress: '10.0.4.88'
  },
  {
    id: 'audit-004',
    timestamp: '2025-03-22 09:00:15 UTC',
    actor: 'System Administrator',
    actorRole: 'System Administrator',
    action: 'ROLE_PERMISSION_UPDATED',
    targetType: 'User Role' as const,
    targetId: 'role-sa-lead',
    targetName: 'Principal Solutions Architect',
    details: 'Enabled direct BOQ discount approval privileges up to 15% without VP escalation.',
    ipAddress: '127.0.0.1'
  }
];

export const MOCK_USERS = [
  {
    id: 'usr-001',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@presaleshq.io',
    role: 'Principal Solutions Architect' as const,
    roleId: 'role-sa',
    department: 'Solutions Engineering' as const,
    status: 'Active' as const,
    lastActive: '5 mins ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-002',
    name: 'Elena Rostova',
    email: 'elena.rostova@presaleshq.io',
    role: 'Presales Lead / Architect' as const,
    roleId: 'role-sa',
    department: 'Solutions Engineering' as const,
    status: 'Active' as const,
    lastActive: '12 mins ago',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-003',
    name: 'Rachel Sterling',
    email: 'rachel.sterling@presaleshq.io',
    role: 'Sales KAM' as const,
    roleId: 'role-kam',
    department: 'Sales' as const,
    status: 'Active' as const,
    lastActive: '1 hour ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-004',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@presaleshq.io',
    role: 'Principal Solutions Architect' as const,
    roleId: 'role-sa',
    department: 'Solutions Engineering' as const,
    status: 'Active' as const,
    lastActive: '25 mins ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-005',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@presaleshq.io',
    role: 'Delivery Manager' as const,
    roleId: 'role-delivery',
    department: 'Delivery & Services' as const,
    status: 'Active' as const,
    lastActive: '3 hours ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-006',
    name: 'Athena Cole',
    email: 'athena.cole@presaleshq.io',
    role: 'System Administrator' as const,
    roleId: 'role-admin',
    department: 'Operations' as const,
    status: 'Active' as const,
    lastActive: '2 hours ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  }
];

// Aligned to the canonical RBAC policy (see src/rbac.ts).
export const MOCK_ROLES = DEFAULT_ROLES;

export const MOCK_MASTER_CONFIG = {
  slaThresholds: [
    { stage: 'Technical Qualification', maxDays: 5, warningDays: 3 },
    { stage: 'Technical Discovery', maxDays: 14, warningDays: 10 },
    { stage: 'Solution Architecture', maxDays: 21, warningDays: 15 },
    { stage: 'POC & Technical Validation', maxDays: 30, warningDays: 20 },
    { stage: 'Proposal & BOQ Sizing', maxDays: 10, warningDays: 7 },
    { stage: 'Commercial Negotiation', maxDays: 15, warningDays: 10 }
  ],
  cloudVendors: ['AWS', 'Google Cloud Platform', 'Microsoft Azure', 'RedHat OpenShift', 'Snowflake', 'Databricks', 'HashiCorp'],
  discountAuthorizations: [
    { tier: 'Tier 1 (0% - 10%)', approverRole: 'Solution Architect', autoApproved: true },
    { tier: 'Tier 2 (10% - 20%)', approverRole: 'Presales Director / VP', autoApproved: false },
    { tier: 'Tier 3 (> 20%)', approverRole: 'Chief Commercial Officer & Finance VP', autoApproved: false }
  ]
};

export const MOCK_SYSTEM_SETTINGS = {
  companyName: 'PresalesHQ Global Solutions Corp',
  defaultCurrency: 'USD ($)',
  fiscalYearStart: 'January 1st',
  timezone: 'America/New_York (UTC-5)',
  sessionTimeoutMinutes: 60,
  enforce2FA: true,
  allowExportCSV: true,
  allowExecutiveOverride: false,
  webhookEndpoint: 'https://api.presaleshq.io/v1/webhooks/crm-sync'
};

