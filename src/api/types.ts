// All data is served exclusively from the Cloud SQL / Spring Boot backend.
// This file retains only the shared type definitions used across pages.

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown_chemical'
  | 'dropdown_instrument'
  | 'comments';

export interface DocumentField {
  id: string;
  document_id: number;
  version_id: number | null;
  label: string;
  field_type: FieldType;
  placeholder: string;
  required: boolean;
  validation_rule: { type: string; min?: number; max?: number } | null;
  sort_order: number;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  tenant_id: number | null;
}
