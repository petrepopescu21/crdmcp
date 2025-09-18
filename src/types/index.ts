export interface CRDDefinition {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    [key: string]: any;
  };
  spec: {
    group: string;
    names: {
      kind: string;
      plural: string;
      singular?: string;
      shortNames?: string[];
    };
    scope: 'Namespaced' | 'Cluster';
    versions: CRDVersion[];
    [key: string]: any;
  };
}

export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  schema?: {
    openAPIV3Schema: any;
  };
  [key: string]: any;
}

export interface CRDMetadata {
  group: string;
  kind: string;
  plural: string;
  singular?: string;
  shortNames?: string[];
  scope: 'Namespaced' | 'Cluster';
  versions: string[];
  filePath: string;
  description?: string;
  category?: string;
}

export interface SampleManifest {
  content: any;
  apiVersion: string;
  kind: string;
  metadata: {
    name?: string;
    namespace?: string;
    [key: string]: any;
  };
  filePath: string;
  description: string;
  tags: string[];
  complexity: 'simple' | 'intermediate' | 'advanced';
}

export interface InstructionDocument {
  title: string;
  content: string;
  filePath: string;
  frontmatter: {
    title?: string;
    applicableCRDs?: string[];
    tags?: string[];
    category?: string;
    priority?: number;
    [key: string]: any;
  };
  detectedCRDs: string[];
  tags: string[];
}

export interface LoadedData {
  crds: Map<string, CRDMetadata>; // key: group/kind
  samples: Map<string, SampleManifest[]>; // key: kind
  instructions: InstructionDocument[];
  statistics: {
    crdsLoaded: number;
    samplesLoaded: number;
    instructionsLoaded: number;
    loadTime: number;
    errors: string[];
    warnings: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  suggestions?: string[];
  metadata?: {
    [key: string]: any;
  };
}

export interface ServerConfig {
  dataDir: string;
  verbose: boolean;
  port?: number;
}

export interface ResourceFilter {
  category?: string;
  search?: string;
  group?: string;
  scope?: 'Namespaced' | 'Cluster';
}

export interface ManifestGenerationRequest {
  resourceType: string; // group/kind
  requirements: string;
  name?: string;
  namespace?: string;
  includeRBAC?: boolean;
  complexity?: 'simple' | 'intermediate' | 'advanced';
}
