# 百度云AIHC服务API

<cite>
**Referenced Files in This Document **  
- [aihcApi.ts](file://src/services/aihcApi.ts)
- [baiducloud.d.ts](file://src/types/baiducloud.d.ts)
</cite>

## 目录
1. [简介](#简介)
2. [核心组件](#核心组件)
3. [端点参考](#端点参考)
4. [错误处理与重试策略](#错误处理与重试策略)
5. [调用示例](#调用示例)
6. [性能优化建议](#性能优化建议)

## 简介
本文档提供了百度云AIHC（人工智能健康云）服务API的完整参考，重点围绕`AIHCApiService`类中封装的核心功能。该服务旨在为前端应用提供对AIHC资源池、数据集和任务管理的统一访问接口。文档详细说明了每个API端点的使用方法、参数结构、返回值格式以及相关的错误处理机制。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L51-L555)

## 核心组件

`AIHCApiService`是整个API交互的核心类，它封装了所有与百度云AIHC后端服务通信的逻辑。该服务通过标准的HTTP `fetch` API进行网络请求，并对响应进行解析和错误处理。其主要职责包括：

*   **资源池管理**：获取自运维（common）和全托管（serverless）两种类型资源池的列表及详情。
*   **队列管理**：查询特定资源池下的计算队列信息。
*   **数据集操作**：根据ID获取数据集的元数据信息。
*   **任务提交**：向指定的资源池和队列提交新的数据转储任务。
*   **存储管理**：获取与资源池关联的PFS（Parallel File System）实例信息。

该服务还定义了多个TypeScript接口来确保数据类型的准确性，如`ResourcePool`、`Queue`、`DatasetInfo`等。

```mermaid
classDiagram
class AIHCApiService {
-baseUrl : string
+getSelfManagedResourcePools() : Promise~ResourcePool[]~
+getFullyManagedResourcePools() : Promise~ResourcePool[]~
+getSelfManagedQueues(resourcePoolId) : Promise~Queue[]~
+getFullyManagedQueues() : Promise~Queue[]~
+getDatasetInfo(datasetId) : Promise~DatasetInfo~
+submitDataDumpTask(resourcePoolId, queueId, taskTemplate) : Promise~TaskSubmissionResult~
+getPFSInstances(resourcePoolId, resourcePoolType) : Promise~PFSInstance[]~
}
class ResourcePool {
+resourcePoolId : string
+name : string
+type : 'common' | 'serverless'
+phase : string
+region : string
+pfsId? : string
+pfsMountTarget? : string
+vpcId? : string
}
class Queue {
+queueId : string
+queueName : string
+resourcePoolId : string
+phase : string
+opened : boolean
+remaining? : { cpuCores? : string; memoryGi? : string; milliCPUcores? : string }
}
class DatasetInfo {
+datasetId : string
+datasetName : string
+datasetCategory : string
+datasetStoragePath : string
+datasetSource : string
+state : string
}
class TaskSubmissionResult {
+jobId : string
+jobName : string
+k8sName : string
}
class PFSInstance {
+id : string
+name : string
+resourcePoolId : string
+status : string
+capacity? : number
+usage? : number
+instanceType? : string
+mountPath? : string
}
AIHCApiService --> ResourcePool : "返回"
AIHCApiService --> Queue : "返回"
AIHCApiService --> DatasetInfo : "返回"
AIHCApiService --> TaskSubmissionResult : "返回"
AIHCApiService --> PFSInstance : "返回"
```

**Diagram sources **
- [aihcApi.ts](file://src/services/aihcApi.ts#L51-L555)
- [aihcApi.ts](file://src/services/aihcApi.ts#L1-L49)

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L1-L555)

## 端点参考

本节详细描述了`AIHCApiService`类中提供的每一个公共方法。

### 获取自运维资源池 (getSelfManagedResourcePools)

此方法用于获取用户自行管理的资源池列表。

**HTTP 方法**: GET
**URL 模板**: `https://console.bce.baidu.com/api/aihc/aihc-service/v3/resourcepools?keywordType=resourcePoolName&keyword=&pageSize=100&orderBy=createdAt&order=desc&region=bj&pageNumber=1&resourcePoolType=common&locale=zh-cn&_={timestamp}`

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `abortController` | AbortController (可选) | 用于取消正在进行的请求。 |

**返回值**: `Promise<ResourcePool[]>`
返回一个`ResourcePool`对象数组。该方法会自动过滤，仅返回状态为`running`的资源池。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L60-L87)

### 获取全托管资源池 (getFullyManagedResourcePools)

此方法用于获取由百度云完全托管的资源池列表。

**HTTP 方法**: GET
**URL 模板**: `https://console.bce.baidu.com/api/aihc/aihc-service/v2/serverless/resourcePool?keywordType=resourcePoolName&keyword=&pageNo=1&pageSize=100&locale=zh-cn&_={timestamp}`

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `abortController` | AbortController (可选) | 用于取消正在进行的请求。 |

**返回值**: `Promise<ResourcePool[]>`
返回一个`ResourcePool`对象数组。该方法会自动过滤，仅返回状态为`running`的资源池。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L90-L139)

### 获取数据集信息 (getDatasetInfo)

此方法根据数据集ID获取其详细信息。

**HTTP 方法**: GET
**URL 模板**: `https://console.bce.baidu.com/api/aihc/data/v1/dataset/{datasetId}?locale=zh-cn&_={timestamp}`

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `datasetId` | string | 要查询的数据集唯一标识符。 |

**返回值**: `Promise<DatasetInfo>`
返回一个`DatasetInfo`对象，包含数据集的名称、类别、存储路径等元数据。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L190-L217)

### 提交数据转储任务 (submitDataDumpTask)

此方法用于向指定的资源池和队列提交一个新的数据转储任务。

**HTTP 方法**: POST
**URL 模板**: `https://console.bce.baidu.com/api/cce/ai-service/v1/cluster/{clusterId}/aijobv3?queueID={queueId}&locale=zh-cn&_={timestamp}`
> **注意**: `{clusterId}` 的值取决于资源池类型。对于全托管资源池，固定为 `aihc-serverless`；对于自运维资源池，则为 `resourcePoolId`。

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `resourcePoolId` | string | 目标资源池的ID。 |
| `queueId` | string | 目标计算队列的ID。 |
| `taskTemplate` | any | 包含任务配置的JSON对象。必须包含 `resourcePoolType` 字段以区分资源池类型。 |

**请求体 (Request Body)**:
```json
{
  "resourcePoolType": "common" | "serverless",
  // ... 其他任务配置参数
}
```

**返回值**: `Promise<TaskSubmissionResult>`
如果任务提交成功，返回一个包含新创建任务的`jobId`、`jobName`和`k8sName`的对象。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L220-L255)

### 获取PFS实例列表 (getPFSInstances)

此方法用于获取与指定资源池关联的PFS（并行文件系统）实例列表。

**HTTP 方法**: GET (内部调用其他端点)
**URL**: 此方法是一个复合操作，会根据资源池类型调用不同的底层API。

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `resourcePoolId` | string | 目标资源池的ID。 |
| `resourcePoolType` | 'common' \| 'serverless' | 资源池的类型。 |
| `abortController` | AbortController (可选) | 用于取消正在进行的请求。 |

**返回值**: `Promise<PFSInstance[]>`
返回一个`PFSInstance`对象数组。对于自运维资源池，信息来源于资源池详情；对于全托管资源池，信息来源于专门的存储信息接口。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L370-L475)

## 错误处理与重试策略

`AIHCApiService`实现了健壮的错误处理机制，以应对网络问题和API错误。

### 错误处理

*   **HTTP 响应错误**: 当`fetch`返回的`response.ok`为`false`时，会抛出一个包含状态码的错误。
*   **API 业务逻辑错误**: 即使HTTP状态码为2xx，也会检查API返回的`success`或`code`字段。如果`success`为`false`或`code`不等于200，则认为API调用失败，并抛出相应错误。
*   **请求取消**: 所有支持`AbortController`的方法都会捕获`AbortError`，并将其转换为一个带有`REQUEST_CANCELLED`代码的特定错误，以便上层应用可以优雅地处理取消操作。
*   **网络连接错误**: 在`getManagedResourcePoolStorageInfo`方法中，会捕获`TypeError`并判断是否为网络连接问题，从而给出更友好的提示。

### 重试策略

在当前实现中，`AIHCApiService`类本身**并未内置自动重试逻辑**。重试决策被委托给调用方（即使用该服务的组件）。这允许上层应用根据具体的错误类型（例如，429限流、5xx服务器错误）和上下文来决定是否以及如何重试。

然而，代码中包含了清晰的错误分类，为实现外部重试策略奠定了基础。例如，可以根据以下原则设计重试：
*   对于临时性网络错误（如超时、连接中断），可以进行指数退避重试。
*   对于429 Too Many Requests错误，应遵循响应头中的`Retry-After`字段进行等待。
*   对于4xx客户端错误（如401认证失败、404资源不存在），通常不应重试，而应提示用户修正输入。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L66-L85)
- [aihcApi.ts](file://src/services/aihcApi.ts#L97-L137)
- [aihcApi.ts](file://src/services/aihcApi.ts#L448-L475)
- [ChatTab.tsx](file://src/components/tabs/ChatTab.tsx#L94-L122)

## 调用示例

以下是如何使用`aihcApiService`的简单示例：

```typescript
// 获取全托管资源池列表
try {
  const pools = await aihcApiService.getFullyManagedResourcePools();
  console.log('可用的全托管资源池:', pools);
} catch (error) {
  if (error.message === 'REQUEST_CANCELLED') {
    console.log('请求已被用户取消');
  } else {
    console.error('获取资源池失败:', error.message);
  }
}

// 提交一个数据转储任务
const taskTemplate = {
  resourcePoolType: 'serverless',
  jobName: 'my-data-dump-job',
  // ... 其他任务配置
};

try {
  const result = await aihcApiService.submitDataDumpTask(
    'rp-abc123', 
    'rq-def456', 
    taskTemplate
  );
  console.log('任务提交成功，任务ID:', result.jobId);
} catch (error) {
  console.error('任务提交失败:', error.message);
}
```

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L557-L557)

## 性能优化建议

为了确保API调用的高效性和用户体验，建议遵循以下最佳实践：

1.  **缓存结果**: 频繁调用的只读API（如`getSelfManagedResourcePools`、`getFullyManagedResourcePools`）的结果可以在内存中进行短期缓存（例如，缓存1-2分钟），以减少不必要的网络请求和服务器负载。
2.  **批量操作**: 如果需要获取多个数据集的信息，考虑是否可以通过单个API调用来批量获取，而不是对每个ID发起单独的`