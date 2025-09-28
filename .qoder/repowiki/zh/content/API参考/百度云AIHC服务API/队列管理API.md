# 队列管理API

<cite>
**Referenced Files in This Document **   
- [QueueListHandler.ts](file://src/handlers/pages/QueueListHandler.ts)
- [aihcApi.ts](file://src/services/aihcApi.ts)
- [DataDumpForm.tsx](file://src/components/DataDumpForm.tsx)
- [index.ts](file://src/types/index.ts)
</cite>

## 目录
1. [简介](#简介)
2. [核心端点](#核心端点)
3. [队列接口定义](#队列接口定义)
4. [全托管子队列遍历逻辑](#全托管子队列遍历逻辑)
5. [响应数据样本](#响应数据样本)
6. [常见问题处理](#常见问题处理)
7. [JavaScript调用示例](#javascript调用示例)

## 简介

队列管理API提供了一套完整的队列查询功能，支持自运维和全托管两种资源池类型的队列列表获取。该API主要用于前端界面中队列选择器的数据填充，确保用户能够正确选择可用的计算队列来提交任务。

系统通过`getSelfManagedQueues`和`getFullyManagedQueues`两个核心方法分别处理不同类型的资源池队列查询需求。所有队列数据都经过严格的状态过滤，只返回处于开启状态的可用队列，保证了用户体验的一致性和可靠性。

**Section sources**
- [QueueListHandler.ts](file://src/handlers/pages/QueueListHandler.ts#L7-L33)
- [aihcApi.ts](file://src/services/aihcApi.ts#L164-L259)

## 核心端点

### getSelfManagedQueues 方法

此方法用于获取自运维资源池中的队列列表。

- **HTTP方法**: GET
- **请求URL构造方式**: 
  ```
  ${baseUrl}/aihc/aihc-service/v3/queues?resourcePoolId=${resourcePoolId}&keyword=&keywordType=queueName&locale=zh-cn&_=${Date.now()}
  ```
- **查询条件**:
  - `resourcePoolId`: 必需参数，指定目标资源池ID
  - `keyword`: 空字符串，表示不进行名称过滤
  - `keywordType`: 固定为"queueName"
  - `_`: 时间戳，用于防止缓存

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L164-L205)

### getFullyManagedQueues 方法

此方法用于获取全托管资源池中的队列列表。

- **HTTP方法**: GET
- **请求URL构造方式**: 
  ```
  ${baseUrl}/aihc/aihc-service/v2/serverless/resourceQueue?pageNo=1&pageSize=100&keywordType=resourceQueueName&keyword=&locale=zh-cn&_=${Date.now()}
  ```
- **查询条件**:
  - `pageNo`: 固定为1，获取第一页数据
  - `pageSize`: 固定为100，每页大小
  - `keywordType`: 固定为"resourceQueueName"
  - `keyword`: 空字符串，表示不进行名称过滤
  - `_`: 时间戳，用于防止缓存

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L208-L259)

## 队列接口定义

`Queue`接口定义了队列的核心属性和结构：

```typescript
export interface Queue {
  queueId: string;
  queueName: string;
  resourcePoolId: string;
  phase: string;
  opened: boolean;
  remaining?: {
    cpuCores?: string;
    memoryGi?: string;
    milliCPUcores?: string;
  };
}
```

### 属性说明

| 属性名 | 类型 | 描述 |
|-------|------|------|
| `queueId` | string | 队列唯一标识符 |
| `queueName` | string | 队列名称 |
| `resourcePoolId` | string | 所属资源池ID |
| `phase` | string | 队列当前阶段（如'ready'、'disabled'） |
| `opened` | boolean | 队列是否开启 |
| `remaining.cpuCores` | string | 剩余CPU核心数 |
| `remaining.memoryGi` | string | 剩余内存（GiB） |
| `remaining.milliCPUcores` | string | 剩余毫核CPU数 |

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L12-L23)
- [index.ts](file://src/types/index.ts#L1-L133)

## 全托管子队列遍历逻辑

全托管资源池的队列结构具有特殊的父子层级关系，需要特别的遍历处理逻辑。

### 数据结构特点

- 父队列（Parent Queue）：位于`items[]`数组中，本身不可作为任务执行队列
- 子队列（Child Queue）：位于`items[].children[]`数组中，是实际可选择的队列

### 遍历与过滤规则

1. **层级遍历**：
   ```javascript
   data.result.result.items.forEach((queue: any) => {
     if (queue.children) {
       // 处理子队列
     }
   });
   ```

2. **开启状态过滤**：
   只有`opened === true`的子队列才会被包含在最终结果中
   ```javascript
   .filter((child: any) => child.opened === true)
   ```

3. **资源池ID映射**：
   子队列的`resourcePoolIds`数组中的第一个元素作为其`resourcePoolId`
   ```javascript
   resourcePoolId: child.resourcePoolIds?.[0] || ''
   ```

这种设计确保了用户只能看到并选择真正可用的子队列，避免了因选择父队列而导致的任务提交失败。

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L208-L259)

## 响应数据样本

### 自运维队列响应示例

```json
{
  "success": true,
  "result": {
    "result": {
      "queueList": [
        {
          "queueId": "q-123",
          "queueName": "训练队列",
          "resourcePoolId": "rp-456",
          "opened": true,
          "remaining": {
            "cpuCores": "16",
            "memoryGi": "64",
            "milliCPUcores": "16000"
          }
        }
      ]
    }
  }
}
```

### 全托管队列响应示例

```json
{
  "success": true,
  "result": {
    "result": {
      "items": [
        {
          "id": "parent-1",
          "name": "主队列",
          "children": [
            {
              "id": "child-1",
              "name": "GPU训练队列",
              "resourcePoolIds": ["aihc-serverless"],
              "phase": "ready",
              "opened": true,
              "remaining": {
                "cpu": "8",
                "memory": "32"
              }
            }
          ]
        }
      ]
    }
  }
}
```

**Section sources**
- [aihcApi.ts](file://src/services/aihcApi.ts#L164-L259)

## 常见问题处理

### 父队列不可选问题

**现象**：用户尝试选择父队列但无法成功提交任务。

**解决方案**：
- 前端UI明确区分父队列和子队列
- 在渲染时仅显示子队列供选择
- 添加提示信息说明"父队列不可直接使用"

### 权限不足问题

**现象**：API返回403错误或空列表。

**处理方案**：
1. 检查用户账号权限
2. 确认资源池访问权限
3. 提供友好的错误提示："权限不足，请联系管理员"

### 网络连接问题

**现象**：请求超时或网络中断。

**处理方案**：
- 实现请求取消机制（AbortController）
- 添加加载状态指示器
- 提供重试功能

### 资源池无可用队列

**现象**：特定资源池下没有可选队列。

**处理方案**：
- 显示友好提示："该资源池下暂无可用队列"
- 引导用户选择其他资源池
- 检查资源池状态是否正常运行

**Section sources**
- [DataDumpForm.tsx](file://src/components/DataDumpForm.tsx#L213-L709)
- [aihcApi.ts](file://src/services/aihcApi.ts#L164-L259)

## JavaScript调用示例

### 基本调用示例

```javascript
// 获取自运维队列
try {
  const queues = await aihcApiService.getSelfManagedQueues('rp-123');
  console.log('可用队列:', queues);
} catch (error) {
  if (error.message === 'REQUEST_CANCELLED') {
    console.log('请求已取消');
  } else {
    console.error('获取队列失败:', error);
  }
}

// 获取全托管队列
try {
  const allQueues = await aihcApiService.getFullyManagedQueues();
  const targetQueues = allQueues.filter(q => q.resourcePoolId === 'aihc-serverless');
  console.log('目标队列:', targetQueues);
} catch (error) {
  console.error('获取全托管队列失败:', error);
}
```

### 异常处理最佳实践

```javascript
// 使用AbortController实现请求取消
const controller = new AbortController();

// 在适当时候取消请求
// controller.abort();

try {
  const queues = await aihcApiService.getSelfManagedQueues('rp-123', controller);
  // 处理成功响应
} catch (error) {
  // 区分不同类型的错误
  if (error instanceof Error && error.name === 'AbortError') {
    // 请求被取消
    console.log('用户取消了操作');
  } else if (error.message.includes('403')) {
    // 权限问题
    setError('权限不足，请检查账户权限');
  } else {
    // 其他错误
    setError(`加载失败: ${error.message}`);
  }
}
```

**Section sources**
- [DataDumpForm.tsx](file://src/components/DataDumpForm.tsx#L213-L709)
- [aihcApi.ts](file://src/services/aihcApi.ts#L164-L259)