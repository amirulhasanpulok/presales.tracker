import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'presales',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'presales',
  max: 10,
  idleTimeoutMillis: 30000,
});

export const query = (text, params) => pool.query(text, params);

export async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      role_name TEXT NOT NULL,
      name TEXT,
      description TEXT,
      users_count INTEGER NOT NULL DEFAULT 0,
      is_system_role BOOLEAN NOT NULL DEFAULT true,
      matching_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      role_id TEXT REFERENCES roles(id),
      department TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      mfa_enabled BOOLEAN NOT NULL DEFAULT false,
      avatar TEXT,
      region TEXT,
      login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      must_change_password BOOLEAN NOT NULL DEFAULT false,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      doc JSONB NOT NULL,
      owner_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_opportunities_account_executive ON opportunities ((doc->>'accountExecutive'));
    CREATE INDEX IF NOT EXISTS idx_opportunities_lead_architect ON opportunities ((doc->>'leadSolutionArchitect'));
    CREATE INDEX IF NOT EXISTS idx_opportunities_client_name ON opportunities ((doc->>'clientName'));

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      doc JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_code ON clients ((doc->>'code')) WHERE doc->>'code' IS NOT NULL;

    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO system_settings (setting_key, setting_value) VALUES ('currency', 'BDT')
      ON CONFLICT (setting_key) DO NOTHING;
    INSERT INTO system_settings (setting_key, setting_value) VALUES ('activity_types', '["Phone Call","Email","Client Meeting","Internal Meeting","Online Meeting","Site Survey","Requirement Gathering","Technical Discussion","OEM Discussion","Solution Design","BOQ Preparation","Proposal Submission","Follow-up","Commercial Discussion","Tender Activity","Documentation","Other"]')
      ON CONFLICT (setting_key) DO NOTHING;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id TEXT,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      meta JSONB,
      ip TEXT,
      actor_role TEXT,
      request_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs (request_id);
    CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs is append-only';
    END;
    $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
    CREATE TRIGGER audit_logs_append_only
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

    -- Scope / Solution Catalog (Section 5 of master prompt)
    CREATE TABLE IF NOT EXISTS scope_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_scope_catalog_name ON scope_catalog (lower(name));
    CREATE INDEX IF NOT EXISTS idx_scope_catalog_category ON scope_catalog (category);
    CREATE INDEX IF NOT EXISTS idx_scope_catalog_status ON scope_catalog (status);

    -- OEM Management (Section 10)
    CREATE TABLE IF NOT EXISTS oems (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_oems_name ON oems (lower(name));

    -- Product Catalog (Section 11)
    CREATE TABLE IF NOT EXISTS product_catalog (
      id TEXT PRIMARY KEY,
      oem_id TEXT REFERENCES oems(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      product_line TEXT,
      model TEXT,
      part_number TEXT,
      description TEXT,
      unit TEXT DEFAULT 'Units',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_product_catalog_model ON product_catalog (lower(model));
    CREATE INDEX IF NOT EXISTS idx_product_catalog_oem ON product_catalog (oem_id);
    CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog (category);

    -- Idempotent migrations for existing clusters
    ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
  `);
}

// Default Scope / Solution Catalog seeded from the master prompt (Section 5).
// Idempotent: only inserts scope entries that don't already exist.
export const DEFAULT_SCOPES = [
  ['NETWORK', 'LAN'], ['NETWORK', 'WAN'], ['NETWORK', 'Wireless Solution'],
  ['NETWORK', 'Structured Cabling'], ['NETWORK', 'Routing'], ['NETWORK', 'Switching'],
  ['NETWORK', 'Internet Connectivity'], ['NETWORK', 'Data Connectivity'], ['NETWORK', 'SD-WAN'],
  ['SECURITY', 'Firewall'], ['SECURITY', 'Network Security'], ['SECURITY', 'Endpoint Security'],
  ['SECURITY', 'Email Security'], ['SECURITY', 'Web Security'], ['SECURITY', 'NAC'],
  ['SECURITY', 'VPN'], ['SECURITY', 'Security Assessment'],
  ['SYSTEM', 'Server'], ['SYSTEM', 'Virtualization'], ['SYSTEM', 'Operating System'],
  ['SYSTEM', 'Active Directory'], ['SYSTEM', 'Microsoft Solutions'], ['SYSTEM', 'Linux Solutions'],
  ['STORAGE & BACKUP', 'Storage'], ['STORAGE & BACKUP', 'SAN'], ['STORAGE & BACKUP', 'NAS'],
  ['STORAGE & BACKUP', 'Backup Solution'], ['STORAGE & BACKUP', 'Disaster Recovery'],
  ['STORAGE & BACKUP', 'Business Continuity'],
  ['DATA CENTER', 'Data Center Deployment'], ['DATA CENTER', 'Data Center Upgrade'],
  ['DATA CENTER', 'HCI'], ['DATA CENTER', 'Private Cloud'], ['DATA CENTER', 'Public Cloud'],
  ['DATA CENTER', 'Hybrid Cloud'],
  ['SURVEILLANCE', 'Surveillance / CCTV'], ['SURVEILLANCE', 'Access Control'],
  ['SURVEILLANCE', 'Attendance System'],
  ['COLLABORATION & COMMUNICATION', 'Zimbra Solution'], ['COLLABORATION & COMMUNICATION', 'Email Solution'],
  ['COLLABORATION & COMMUNICATION', 'Bulk Email Service'], ['COLLABORATION & COMMUNICATION', 'Bulk SMS Service'],
];

export async function seedScopeCatalog() {
  for (let i = 0; i < DEFAULT_SCOPES.length; i += 1) {
    const [category, name] = DEFAULT_SCOPES[i];
    const id = `scope-${String(i + 1).padStart(3, '0')}`;
    await query(
      `INSERT INTO scope_catalog (id, name, category, status, sort_order)
       VALUES ($1, $2, $3, 'Active', $4)
       ON CONFLICT (lower(name)) DO NOTHING`,
      [id, name, category, i],
    );
  }
}

// ---------------------------------------------------------------------------
// OEM & Product Catalog (Sections 10 & 11 of the master prompt)
// ---------------------------------------------------------------------------
export const DEFAULT_OEMS = [
  ['Cisco', 'https://www.cisco.com'],
  ['Dell', 'https://www.dell.com'],
  ['HPE', 'https://www.hpe.com'],
  ['Fortinet', 'https://www.fortinet.com'],
  ['Sophos', 'https://www.sophos.com'],
  ['Huawei', 'https://www.huawei.com'],
  ['Aruba', 'https://www.arubanetworks.com'],
  ['Juniper', 'https://www.juniper.net'],
  ['Palo Alto Networks', 'https://www.paloaltonetworks.com'],
  ['Veeam', 'https://www.veeam.com'],
  ['Zimbra', 'https://www.zimbra.com'],
  ['Microsoft', 'https://www.microsoft.com'],
  ['VMware', 'https://www.vmware.com'],
  ['NetApp', 'https://www.netapp.com'],
  ['Commvault', 'https://www.commvault.com'],
  ['Lenovo', 'https://www.lenovo.com'],
  ['Nagios', 'https://www.nagios.org'],
  ['Zabbix', 'https://www.zabbix.com'],
  ['UBIQUITI', 'https://www.ui.com'],
];

export const DEFAULT_PRODUCTS = [
  ['Cisco', 'Networking', 'Switches', 'Catalyst 9300', 'C9300-48T', '48-port managed switch', 'Units'],
  ['Cisco', 'Networking', 'Switches', 'Catalyst 9500', 'C9500-24Y4C', '24x 25G/100G uplinks switch', 'Units'],
  ['Cisco', 'Networking', 'Wireless', 'Catalyst 9800', 'C9800-40', 'Wireless controller', 'Units'],
  ['Cisco', 'Security', 'Firewall', 'Firepower 1010', 'FPR-1010', 'Next-gen firewall (10 series)', 'Units'],
  ['Cisco', 'Security', 'Firewall', 'Firepower 2110', 'FPR-2110', 'Next-gen firewall (2100 series)', 'Units'],
  ['Cisco', 'Security', 'Firewall', 'Firepower 4110', 'FPR-4110', 'Next-gen firewall (4100 series)', 'Units'],
  ['Fortinet', 'Security', 'Firewall', 'FortiGate 40F', 'FGT-40F', 'Entry-level UTM firewall', 'Units'],
  ['Fortinet', 'Security', 'Firewall', 'FortiGate 60F', 'FGT-60F', 'Small office UTM', 'Units'],
  ['Fortinet', 'Security', 'Firewall', 'FortiGate 100F', 'FGT-100F', 'Mid-range UTM firewall', 'Units'],
  ['Fortinet', 'Security', 'Firewall', 'FortiGate 200F', 'FGT-200F', 'High performance UTM', 'Units'],
  ['Fortinet', 'Security', 'Firewall', 'FortiGate 600E', 'FGT-600E', 'Enterprise edge firewall', 'Units'],
  ['Fortinet', 'Networking', 'Switches', 'FortiSwitch 124E', 'FS-124E', '24-port access switch', 'Units'],
  ['Fortinet', 'Networking', 'Wireless', 'FortiAP 231G', 'FAP-231G', 'Wi-Fi 6E AP', 'Units'],
  ['Sophos', 'Security', 'Firewall', 'XGS 2100', 'XGS2100', 'Next-gen firewall (10 users)', 'Units'],
  ['Sophos', 'Security', 'Firewall', 'XGS 3300', 'XGS3300', 'Next-gen firewall (100 users)', 'Units'],
  ['Sophos', 'Security', 'Endpoint', 'Intercept X', 'IX-CORP', 'Endpoint protection (per seat/Yr)', 'Users/Yr'],
  ['Palo Alto Networks', 'Security', 'Firewall', 'PA-440', 'PAN-PA-440', 'Next-gen firewall (400 series)', 'Units'],
  ['Palo Alto Networks', 'Security', 'Firewall', 'PA-3260', 'PAN-PA-3260', 'Next-gen firewall (3200 series)', 'Units'],
  ['Huawei', 'Networking', 'Switches', 'S5735-L48T4X', 'S5735-L48T4X', '48-port managed switch', 'Units'],
  ['Huawei', 'Security', 'Firewall', 'USG6525E', 'USG6525E', 'Next-gen firewall', 'Units'],
  ['Aruba', 'Networking', 'Wireless', 'AP-635', 'AP-635', 'Wi-Fi 6E indoor AP', 'Units'],
  ['Aruba', 'Networking', 'Switches', 'CX 6300M', 'JL662A', 'Modular L3 switch', 'Units'],
  ['Dell', 'Server', 'Rack Server', 'PowerEdge R750', 'R750-4S', '2U rack server', 'Units'],
  ['Dell', 'Storage', 'SAN', 'PowerStore 500T', 'PS500T', 'All-flash storage array', 'Units'],
  ['HPE', 'Server', 'Rack Server', 'ProLiant DL380 Gen11', 'DL380G11', '2U rack server', 'Units'],
  ['HPE', 'Storage', 'SAN', 'Alletra 5000', 'AL5000', 'Hybrid storage', 'Units'],
  ['Lenovo', 'Server', 'Rack Server', 'ThinkSystem SR650 V2', 'SR650V2', '2U rack server', 'Units'],
  ['Veeam', 'Storage', 'Backup', 'Veeam B&R', 'VBRCOMP', 'Backup & replication (per socket/Yr)', 'License/Yr'],
  ['NetApp', 'Storage', 'SAN', 'FAS2720', 'FAS2720', 'Hybrid storage (ONTAP)', 'Units'],
  ['Commvault', 'Storage', 'Backup', 'Commvault Complete', 'CV-COMP', 'Data protection platform (per TB/Yr)', 'TB/Yr'],
  ['Microsoft', 'Software', 'Operating System', 'Windows Server 2022 Std', 'SVR-2022-STD', 'Server OS license', 'License/Yr'],
  ['Microsoft', 'Software', 'Collaboration', 'Microsoft 365 E3', 'M365-E3', 'Productivity suite (per seat/Yr)', 'Users/Yr'],
  ['VMware', 'Software', 'Virtualization', 'vSphere 8 Std', 'VS8-STD', 'Virtualization platform (per socket)', 'License/Yr'],
  ['Nagios', 'Software', 'Monitoring', 'Nagios XI', 'XI-ENT', 'Network monitoring (per node)', 'License/Yr'],
  ['Zabbix', 'Software', 'Monitoring', 'Zabbix Enterprise', 'ZBX-ENT', 'Enterprise monitoring', 'License/Yr'],
  ['UBIQUITI', 'Networking', 'Wireless', 'UniFi U6 Pro', 'U6-PRO', 'Wi-Fi 6 AP', 'Units'],
  ['UBIQUITI', 'Networking', 'Switches', 'UniFi USW-24-PoE', 'USW-24-POE', '24-port PoE switch', 'Units'],
];

export async function seedOEMCatalog() {
  for (let i = 0; i < DEFAULT_OEMS.length; i += 1) {
    const [name, website] = DEFAULT_OEMS[i];
    const id = `oem-${String(i + 1).padStart(3, '0')}`;
    await query(
      `INSERT INTO oems (id, name, website, status)
       VALUES ($1, $2, $3, 'Active')
       ON CONFLICT (lower(name)) DO NOTHING`,
      [id, name, website],
    );
  }
}

export async function seedProductCatalog() {
  // Resolve OEM IDs by name for foreign key.
  const oemRows = (await query('SELECT id, name FROM oems')).rows;
  const oemMap = new Map(oemRows.map((r) => [r.name.toLowerCase(), r.id]));
  for (let i = 0; i < DEFAULT_PRODUCTS.length; i += 1) {
    const [oemName, category, productLine, name, model, description, unit] = DEFAULT_PRODUCTS[i];
    const oemId = oemMap.get(oemName.toLowerCase());
    if (!oemId) continue;
    const id = `prod-${String(i + 1).padStart(3, '0')}`;
    await query(
      `INSERT INTO product_catalog (id, oem_id, name, category, product_line, model, part_number, description, unit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active')
       ON CONFLICT (lower(model)) DO NOTHING`,
      [id, oemId, name, category, productLine, name, model, description, unit],
    );
  }
}

export default pool;
