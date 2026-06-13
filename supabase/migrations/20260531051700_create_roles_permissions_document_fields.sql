/*
  # Roles, Permissions, and Document Fields schema

  ## New Tables

  ### `permission`
  - `id` (uuid, pk) — unique permission
  - `code` (text, unique) — e.g. USER_VIEW
  - `description` (text)
  - `module` (text) — grouping label

  ### `role`
  - `id` (uuid, pk)
  - `code` (text, unique) — e.g. ANALYST
  - `name` (text)
  - `description` (text)
  - `is_system` (bool) — system roles cannot be deleted
  - `tenant_id` (int, nullable) — null = global/system role

  ### `role_permission`
  - `role_id` (uuid FK role) — many-to-many join
  - `permission_id` (uuid FK permission)
  - PK is (role_id, permission_id)

  ### `document_field`
  - `id` (uuid, pk)
  - `document_id` (int) — links to backend document record
  - `version_id` (int, nullable)
  - `label` (text) — field display name
  - `field_type` (text) — text | number | date | dropdown_chemical | dropdown_instrument | comments
  - `placeholder` (text) default '--'
  - `required` (bool)
  - `validation_rule` (jsonb, nullable) — { type: 'range', min, max }
  - `sort_order` (int) — display order
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all (roles, permissions are tenant-visible)
  - Only service-role / admin can mutate permissions (fixed catalog)
  - Roles and role_permissions allow authenticated insert/update/delete
*/

-- ── permission ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permission (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  module      text NOT NULL DEFAULT 'General',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE permission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permissions"
  ON permission FOR SELECT
  TO authenticated
  USING (true);

-- Seed all permissions
INSERT INTO permission (code, description, module) VALUES
  ('USER_VIEW','View users','System Administration'),
  ('USER_CREATE','Create users','System Administration'),
  ('USER_EDIT','Edit users','System Administration'),
  ('USER_DELETE','Delete users','System Administration'),
  ('USER_ASSIGN_ROLE','Assign roles to users','System Administration'),
  ('ROLE_VIEW','View roles','System Administration'),
  ('ROLE_CREATE','Create roles','System Administration'),
  ('ROLE_EDIT','Edit roles','System Administration'),
  ('ROLE_DELETE','Delete roles','System Administration'),
  ('ROLE_PERMISSION_MAP','Map permissions to roles','System Administration'),
  ('TENANT_VIEW','View tenants','System Administration'),
  ('TENANT_CREATE','Create tenants','System Administration'),
  ('TENANT_EDIT','Edit tenants','System Administration'),
  ('BRANCH_VIEW','View branches','System Administration'),
  ('BRANCH_CREATE','Create branches','System Administration'),
  ('BRANCH_EDIT','Edit branches','System Administration'),
  ('SYSTEM_HEALTH_VIEW','View system health','System Administration'),
  ('SYSTEM_LOG_VIEW','View system logs','System Administration'),
  ('SYSTEM_ALERT_VIEW','View system alerts','System Administration'),
  ('CHEMICAL_MASTER_VIEW','View chemical master','Chemical Module'),
  ('CHEMICAL_MASTER_CREATE','Create chemical master','Chemical Module'),
  ('CHEMICAL_MASTER_EDIT','Edit chemical master','Chemical Module'),
  ('CHEMICAL_MASTER_DELETE','Delete chemical master','Chemical Module'),
  ('CHEMICAL_REGISTER','Register chemicals','Chemical Module'),
  ('CHEMICAL_VIEW','View chemicals','Chemical Module'),
  ('CHEMICAL_EDIT','Edit chemicals','Chemical Module'),
  ('CHEMICAL_STOCK_VIEW','View chemical stock','Chemical Module'),
  ('CHEMICAL_STOCK_ADJUST','Adjust chemical stock','Chemical Module'),
  ('CHEMICAL_MOVEMENT_VIEW','View chemical movements','Chemical Module'),
  ('CHEMICAL_ISSUE','Issue chemicals','Chemical Module'),
  ('CHEMICAL_DESTROY','Destroy chemicals','Chemical Module'),
  ('CHEMICAL_RETIRE','Retire chemicals','Chemical Module'),
  ('CHEMICAL_LABEL_PRINT','Print chemical labels','Chemical Module'),
  ('CHEMICAL_EXPIRY_ALERT_VIEW','View expiry alerts','Chemical Module'),
  ('CHEMICAL_REORDER_ALERT_VIEW','View reorder alerts','Chemical Module'),
  ('INSTRUMENT_VIEW','View instruments','Instrument Module'),
  ('INSTRUMENT_CREATE','Create instruments','Instrument Module'),
  ('INSTRUMENT_EDIT','Edit instruments','Instrument Module'),
  ('INSTRUMENT_DEACTIVATE','Deactivate instruments','Instrument Module'),
  ('CALIBRATION_SCHEDULE_VIEW','View calibration schedule','Instrument Module'),
  ('CALIBRATION_SCHEDULE_EDIT','Edit calibration schedule','Instrument Module'),
  ('CALIBRATION_ALLOCATE','Allocate calibration','Instrument Module'),
  ('CALIBRATION_EXECUTE','Execute calibration','Instrument Module'),
  ('CALIBRATION_REVIEW','Review calibration','Instrument Module'),
  ('CALIBRATION_APPROVE','Approve calibration','Instrument Module'),
  ('CALIBRATION_TREND_VIEW','View calibration trends','Instrument Module'),
  ('MAINTENANCE_VIEW','View maintenance','Instrument Module'),
  ('MAINTENANCE_CREATE','Create maintenance','Instrument Module'),
  ('MAINTENANCE_APPROVE','Approve maintenance','Instrument Module'),
  ('DOWNTIME_LOG','Log instrument downtime','Instrument Module'),
  ('DOWNTIME_VIEW','View downtime','Instrument Module'),
  ('QUALIFICATION_VIEW','View qualification','Instrument Module'),
  ('QUALIFICATION_EXECUTE','Execute qualification','Instrument Module'),
  ('QUALIFICATION_APPROVE','Approve qualification','Instrument Module'),
  ('INVENTORY_ITEM_VIEW','View inventory items','Inventory Module'),
  ('INVENTORY_ITEM_CREATE','Create inventory items','Inventory Module'),
  ('INVENTORY_ITEM_EDIT','Edit inventory items','Inventory Module'),
  ('INVENTORY_STOCK_VIEW','View inventory stock','Inventory Module'),
  ('INVENTORY_STOCK_ADJUST','Adjust inventory stock','Inventory Module'),
  ('INVENTORY_EXPIRY_ALERT_VIEW','View inventory expiry alerts','Inventory Module'),
  ('INVENTORY_REORDER_ALERT_VIEW','View inventory reorder alerts','Inventory Module'),
  ('SUPPLIER_VIEW','View suppliers','Supplier Module'),
  ('SUPPLIER_CREATE','Create suppliers','Supplier Module'),
  ('SUPPLIER_EDIT','Edit suppliers','Supplier Module'),
  ('SUPPLIER_DOCUMENT_UPLOAD','Upload supplier documents','Supplier Module'),
  ('SUPPLIER_DOCUMENT_VIEW','View supplier documents','Supplier Module'),
  ('SUPPLIER_RATING','Rate suppliers','Supplier Module'),
  ('SUPPLIER_ITEM_MAP','Map items to suppliers','Supplier Module'),
  ('ORDER_VIEW','View orders','OMS Module'),
  ('ORDER_CREATE','Create orders','OMS Module'),
  ('ORDER_EDIT','Edit orders','OMS Module'),
  ('ORDER_APPROVE','Approve orders','OMS Module'),
  ('ORDER_CANCEL','Cancel orders','OMS Module'),
  ('PO_VIEW','View purchase orders','OMS Module'),
  ('PO_CREATE','Create purchase orders','OMS Module'),
  ('PO_APPROVE','Approve purchase orders','OMS Module'),
  ('PO_PRINT','Print purchase orders','OMS Module'),
  ('GRN_VIEW','View goods receipts','OMS Module'),
  ('GRN_CREATE','Create goods receipts','OMS Module'),
  ('GRN_APPROVE','Approve goods receipts','OMS Module'),
  ('DEVIATION_VIEW','View deviations','QA / QC Module'),
  ('DEVIATION_CREATE','Create deviations','QA / QC Module'),
  ('DEVIATION_INVESTIGATE','Investigate deviations','QA / QC Module'),
  ('DEVIATION_CLOSE','Close deviations','QA / QC Module'),
  ('OOS_VIEW','View OOS cases','QA / QC Module'),
  ('OOS_CREATE','Create OOS cases','QA / QC Module'),
  ('OOS_INVESTIGATE','Investigate OOS cases','QA / QC Module'),
  ('OOS_APPROVE','Approve OOS cases','QA / QC Module'),
  ('CAPA_VIEW','View CAPA','QA / QC Module'),
  ('CAPA_CREATE','Create CAPA','QA / QC Module'),
  ('CAPA_ASSIGN','Assign CAPA','QA / QC Module'),
  ('CAPA_CLOSE','Close CAPA','QA / QC Module'),
  ('AUDIT_VIEW','View audit trail','QA / QC Module'),
  ('SAMPLE_REGISTER','Register samples','Sample & Test Module'),
  ('SAMPLE_VIEW','View samples','Sample & Test Module'),
  ('SAMPLE_EDIT','Edit samples','Sample & Test Module'),
  ('TEST_ASSIGN','Assign tests','Sample & Test Module'),
  ('TEST_EXECUTE','Execute tests','Sample & Test Module'),
  ('TEST_REVIEW','Review tests','Sample & Test Module'),
  ('TEST_APPROVE','Approve tests','Sample & Test Module'),
  ('RESULT_ENTER','Enter test results','Sample & Test Module'),
  ('RESULT_REVIEW','Review test results','Sample & Test Module'),
  ('RESULT_APPROVE','Approve test results','Sample & Test Module'),
  ('COA_GENERATE','Generate COA','Sample & Test Module'),
  ('COA_APPROVE','Approve COA','Sample & Test Module'),
  ('COA_PRINT','Print COA','Sample & Test Module'),
  ('AI_INVENTORY_FORECAST_VIEW','View AI inventory forecasts','AI Module'),
  ('AI_OOS_RISK_VIEW','View AI OOS risk','AI Module'),
  ('AI_INSTRUMENT_TREND_VIEW','View AI instrument trends','AI Module'),
  ('AI_WORKLOAD_VIEW','View AI workload predictions','AI Module'),
  ('AI_AUTO_ORDER_INITIATE','Initiate AI auto orders','AI Module'),
  ('WIDGET_CRITICAL_ALERTS','Widget: Critical alerts','Dashboard Widgets'),
  ('WIDGET_WORKLOAD','Widget: Workload','Dashboard Widgets'),
  ('WIDGET_LOW_STOCK','Widget: Low stock','Dashboard Widgets'),
  ('WIDGET_CALIBRATION_DUE','Widget: Calibration due','Dashboard Widgets'),
  ('WIDGET_OOS','Widget: OOS','Dashboard Widgets'),
  ('WIDGET_EXECUTIVE_KPI','Widget: Executive KPI','Dashboard Widgets'),
  ('WIDGET_AI_INSIGHTS','Widget: AI insights','Dashboard Widgets')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description, module = EXCLUDED.module;

-- ── role ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system   boolean NOT NULL DEFAULT false,
  tenant_id   int,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE role ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles"
  ON role FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create roles"
  ON role FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update non-system roles"
  ON role FOR UPDATE
  TO authenticated
  USING (is_system = false)
  WITH CHECK (is_system = false);

CREATE POLICY "Authenticated users can delete non-system roles"
  ON role FOR DELETE
  TO authenticated
  USING (is_system = false);

-- Seed default roles
INSERT INTO role (code, name, description, is_system) VALUES
  ('SUPER_ADMIN','Super Administrator','Full system access',true),
  ('LAB_MANAGER','Lab Manager','Lab management and approvals',false),
  ('ANALYST','Analyst','Test execution and result entry',false),
  ('REVIEWER','Reviewer','Result review and approval',false),
  ('APPROVER','Approver','Final approval authority',false),
  ('INVENTORY_MANAGER','Inventory Manager','Chemical and inventory management',false),
  ('INSTRUMENT_MANAGER','Instrument Manager','Instrument and calibration management',false),
  ('QA_MANAGER','QA Manager','Quality assurance management',false),
  ('PURCHASER','Purchaser','Order and purchase management',false),
  ('VIEWER','Read-Only Viewer','Read-only access to all modules',true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ── role_permission ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permission (
  role_id       uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
  assigned_at   timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read role permissions"
  ON role_permission FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can assign permissions to roles"
  ON role_permission FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can remove permissions from roles"
  ON role_permission FOR DELETE
  TO authenticated
  USING (true);

-- ── document_field ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_field (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     int NOT NULL,
  version_id      int,
  label           text NOT NULL,
  field_type      text NOT NULL DEFAULT 'text'
                  CHECK (field_type IN ('text','number','date','dropdown_chemical','dropdown_instrument','comments')),
  placeholder     text NOT NULL DEFAULT '--',
  required        boolean NOT NULL DEFAULT false,
  validation_rule jsonb,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_field_document ON document_field(document_id, version_id);

ALTER TABLE document_field ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read document fields"
  ON document_field FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document fields"
  ON document_field FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update document fields"
  ON document_field FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document fields"
  ON document_field FOR DELETE
  TO authenticated
  USING (true);
