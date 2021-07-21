export interface DirectusResponse<T> {
  data: T;
}

export interface DirectusCollection {
  collection: string;
  fields?: DirectusField[];
  meta?: Partial<DirectusCollectionMeta>;
  schema?: Partial<DirectusCollectionSchema>;
}

export interface DirectusCollectionSchema {
  name: string;
  comment: string;
  [key: string]: any;
}

export interface DirectusCollectionMeta {
  collection: string;
  icon: string;
  note: string;
  display_template: string;
  hidden: boolean;
  singleton: boolean;
  translations: unknown;
  archive_field: string;
  archive_value: string;
  unarchive_value: string;
  archive_app_filter: boolean;
  sort_field: boolean;
}

export interface DirectusField {
  collection?: string;
  field: string;
  type: string;
  meta?: Partial<DirectusFieldMeta>;
  schema?: Partial<DirectusFieldSchema>;
}

export interface DirectusFieldMeta {
  id: number;
  collection: string;
  field: string;
  special: string | string[];
  interface: string;
  options: unknown;
  display: string;
  display_options: string;
  readonly: boolean;
  hidden: boolean;
  sort: number;
  width: "half" | "half-left" | "half-right" | "half-space" | "full" | "fill";
  translations: unknown;
  note: string;
}

export interface DirectusFieldSchema {
  name: string;
  table: string;
  data_type: string;
  default_value: unknown;
  max_length: number;
  length: number;
  numeric_precision: number | null;
  numeric_scale: number | null;
  has_auto_increment: boolean;
  is_unique: boolean;
  is_nullable: boolean;
  is_primary_key: boolean;
  foreign_key_column: string;
  foreign_key_table: string;
  comment: string;
}

export interface DirectusRelation {
  collection: string;
  field: string;
  related_collection: string;
  meta?: Partial<DirectusRelationMeta>;
  schema?: Partial<DirectusRelationSchema>;
}

export interface DirectusRelationMeta {
  id: number;
  many_collection: string;
  many_field: string;
  one_collection: string;
  one_field: string;
  one_allowed_collections: string;
  one_collection_field: string;
  one_deselect_action: "nullify" | "delete";
  sort_field: string;
  junction_field: string;
}

export interface DirectusRelationSchema {
  table: string;
  column: string;
  foreign_key_table: string;
  foreign_key_column: string;
  constraint_name: string;
  on_update: string;
  on_delete: string;
}
