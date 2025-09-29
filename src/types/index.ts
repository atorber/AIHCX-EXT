export interface RequestHeaders {
  authorization?: string;
  'x-api-key'?: string;
  token?: string;
  ak?: string;
  sk?: string;
  region?: string;
  host?: string;
  'content-type'?: string;
  [key: string]: string | undefined;
}

export interface TaskParams {
  type: string;
  dataSource: string;
  priority: string;
  customParams: string;
  generated: string;
  name: string;
  commandScript: string;
  jsonItems: { title: string; text: string }[];
  yamlItems: { title: string; text: string }[];
  cliItems: { title: string; text: string; doc?: string }[];
  apiDocs: { title: string; text: string; requestExample?: string }[];
  chatConfig?: {
    serviceUrl: string;
    accessToken: string;
    basePath: string;
    serviceId?: string;
    isLoaded?: boolean;
  };
  chatLoading?: boolean;
  chatError?: string;
  isDataDownloadPage?: boolean;
  isDataDumpPage?: boolean;
  datasetId?: string;
  modelId?: string;
  category?: string;
}

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export interface PageInfo {
  isSupported: boolean;
  pageName: string;
  url: string;
  params: Record<string, string>;
}

export interface AIHCXHelperConfig {
  enabled: boolean;
  highlightImages: boolean;
  showImageInfo: boolean;
}

export interface Task {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  params: Record<string, any>;
  result?: Record<string, any>;
}

export interface BaiduCredentials {
  ak: string;
  sk: string;
  endpoint?: string;
}

export type TabType = 'cli' | 'commandScript' | 'json' | 'yaml' | 'apiDocs' | 'chat' | 'dataImport' | 'modelDeployment';

// 数据转储相关类型定义
export interface DataDumpConfig {
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  pfsId: string;
  storagePath: string;
  originalStoragePath?: string; // 新增：原始存储路径（带bos:前缀）
  datasetName?: string; // 数据集名称
}

// 数据导入相关类型定义
export interface DataImportConfig {
  datasetVersion: string;
  importType: 'HuggingFace' | 'ModelScope' | '数据集';
  importUrl: string;
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  datasetId?: string;
  datasetCategory?: string; // 数据集类别
}

// 模型部署相关类型定义
export interface ModelDeploymentConfig {
  modelVersion: string;
  accelerationFramework: string;
  resourcePoolType: '自运维' | '全托管';
  resourcePoolId: string;
  queueId: string;
  imageAddress: string;
  startupCommand: string;
  modelId?: string;
}

export interface DataDumpTaskTemplate {
  tensorboard: {
    enable: boolean;
    logPath: string;
    serviceType: string;
  };
  autoCreatePVC: boolean;
  priority: string;
  isCustomDelete: boolean;
  retentionPeriod: string;
  retentionUnit: string;
  isPolicy: boolean;
  cpromId: string;
  selectedRowKeys: string[];
  pfsId: string;
  imageType: string;
  runningTimeoutStopTimeUnit: string;
  visibleScope: number;
  resourcePoolType: string;
  jobFramework: string;
  name: string;
  command: string;
  enabledHangDetection: boolean;
  unconditionalFaultToleranceLimit: number;
  enableReplace: boolean;
  queue: string;
  vpcId: string;
  datasource: Array<{
    type: string;
    name?: string;
    sourcePath?: string;
    mountPath: string;
    pfsId?: string;  // 为PFS类型数据源添加pfsId字段
    options: any;
  }>;
  jobSpec: {
    Master: {
      image: string;
      tag: string;
      replicas: number;
      env: Record<string, string>;
      resource: any;
      restartPolicy: string;
    };
  };
  faultTolerance: boolean;
  jobDistributed: boolean;
  labels: Record<string, string>;
  annotations: any;
  workloadType: string;
}