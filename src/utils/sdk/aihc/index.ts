import { Auth } from "@baiducloud/sdk";

class BceAihc {
    ak: string;
    sk: string;
    host: string;

    v2Headers: Record<string, string> = {
        'version': 'v2',
    };

    jobHeaders: Record<string, string> = {
        'X-API-Version': 'v2',
    };

    constructor(ak: string, sk: string, host: string) {
        this.ak = ak;
        this.sk = sk;
        this.host = host;
    }

    _getSignature = (ak: string, sk: string, method: string, path: string, query: Record<string, any>, headers: Record<string, any>) => {
        const auth = new Auth(ak, sk);
        // 设置有效时间
        let timestamp = Math.floor(new Date().getTime() / 1000);
        let expirationPeriondInSeconds = 1800;
        let signature = auth.generateAuthorization(
            method,
            path,
            query,
            headers,
            timestamp,
            expirationPeriondInSeconds
        );
        return signature;
    };

    requestBecOpenApi = async (path: string, method: string, query: Record<string, any> = {}, body: Record<string, any> = {}, headers: Record<string, any> = {}) => {
        // 构建URL
        const url = new URL(`https://${this.host}${path}`);

        // 添加查询参数
        Object.keys(query).forEach(key => {
            if (query[key] !== undefined && query[key] !== null) {
                url.searchParams.append(key, query[key]);
            }
        });

        // 设置请求头
        const requestHeaders: Record<string, string> = {
            'Host': this.host,
            'Content-Type': 'application/json',
            ...headers
        };

        // 生成签名
        const signature = this._getSignature(this.ak, this.sk, method, path, query, requestHeaders);
        requestHeaders.Authorization = signature;

        // 准备请求体
        let requestBody: string | undefined;
        if (body && Object.keys(body).length > 0) {
            requestBody = JSON.stringify(body);
        }

        try {
            const response = await fetch(url.toString(), {
                method,
                headers: requestHeaders,
                body: requestBody
            });

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }

                const error = {
                    statusCode: response.status,
                    message: `${response.status} - ${errorData.message || response.statusText}`,
                    error: errorData,
                    response: {
                        statusCode: response.status,
                        body: errorData,
                        headers: Object.fromEntries(response.headers.entries())
                    }
                };

                console.error("API请求失败：", error);
                return error;
            }

            const result = await response.json();
            return result;
        } catch (err: any) {
            console.error("请求异常：", err);
            return {
                error: true,
                message: err.message || '网络请求失败',
                originalError: err
            };
        }
    };

    // ========== 分布式任务相关接口 ==========

    /**
     * 创建任务
     * @param resourcePoolId 资源池ID
     * @param queueId 队列ID（全托管资源池时必传）
     * @param body 任务创建参数
     */
    CreateJob = async (
        resourcePoolId: string,
        queueId: string | undefined,
        body: {
            name: string;
            jobType: string;
            command: string;
            jobSpec: {
                replicas: number;
                image: string;
                resources?: Array<{
                    name: string;
                    value: string;
                }>;
                envs?: Array<{
                    name: string;
                    value: string;
                }>;
                enableRDMA?: boolean;
            };
            labels?: Array<{
                key: string;
                value: string;
            }>;
            datasources?: Array<{
                type: 'pfs' | 'bos';
                name: string;
                mountPath: string;
                sourcePath?: string;
            }>;
        }
    ) => {
        // 构建查询参数
        const query: Record<string, any> = { action: 'CreateJob' };

        // 如果是全托管资源池，资源池id统一替换为aihc-serverless
        if (resourcePoolId === 'aihc-serverless') {
            query.resourcePoolId = 'aihc-serverless';
            if (queueId) {
                query.queueID = queueId;
            }
        } else {
            query.resourcePoolId = resourcePoolId;
        }

        console.log('CreateJob query:', query);
        console.log('CreateJob body:', body);
        console.log('CreateJob headers:', this.jobHeaders);

        return this.requestBecOpenApi('/', 'POST', query, body, this.jobHeaders);
    };

    // ========== 模型管理相关接口 ==========

    /**
     * 创建模型
     * @param body 模型创建参数
     */
    CreateModel = async (body: {
        name: string;
        description?: string;
        modelFormat: string;
        owner?: string;
        visibilityScope?: string;
        initVersionEntry: {
            source: string;
            storageBucket: string;
            storagePath: string;
            modelMetrics?: string;
            description?: string;
        };
    }) => {
        return this.requestBecOpenApi('/', 'POST', { action: 'CreateModel' }, body, this.v2Headers);
    };

    /**
     * 获取模型列表
     * @param query 查询参数
     */
    DescribeModels = async (query: {
        keyword?: string;
        pageNumber?: number;
        pageSize?: number;
    } = {}) => {
        return this.requestBecOpenApi('/', 'GET', { action: 'DescribeModels', ...query }, {}, this.v2Headers);
    };

    /**
     * 获取模型详情
     * @param modelId 模型ID
     * @param versionId 版本ID
     */
    DescribeModelVersion = async (modelId: string, versionId: string) => {
        return this.requestBecOpenApi('/', 'GET', {
            action: 'DescribeModelVersion',
            modelId,
            versionId
        }, {}, this.v2Headers);
    };

    /**
     * 获取模型版本列表
     * @param modelId 模型ID
     * @param pageNumber 页码
     * @param pageSize 每页大小
     */
    DescribeModelVersions = async (modelId: string, pageNumber?: number, pageSize?: number) => {
        return this.requestBecOpenApi('/', 'GET', {
            action: 'DescribeModelVersions',
            modelId,
            pageNumber,
            pageSize
        }, {}, this.v2Headers);
    };

    // ========== 数据集相关接口 ==========

    /**
     * 创建数据集
     * @param body 数据集创建参数
     */
    CreateDataset = async (body: {
        name: string;
        storageType: 'PFS' | 'BOS';
        storageInstance: string;
        importFormat: 'FILE' | 'FOLDER';
        description?: string;
        owner?: string;
        visibilityScope: 'ALL_PEOPLE' | 'ONLY_OWNER' | 'USER_GROUP';
        visibilityUser?: Array<{
            id: string;
            name: string;
            permission: 'r' | 'rw';
        }>;
        visibilityGroup?: Array<{
            id: string;
            name: string;
            permission: 'r' | 'rw';
        }>;
        initVersionEntry: {
            description?: string;
            storagePath: string;
            mountPath: string;
        };
    }) => {
        return this.requestBecOpenApi('/', 'POST', { action: 'CreateDataset' }, body, this.v2Headers);
    };

    /**
     * 获取数据集列表
     * @param query 查询参数
     */
    DescribeDatasets = async (query: {
        keyword?: string;
        storageType?: 'PFS' | 'BOS';
        storageInstances?: string;
        importFormat?: 'FILE' | 'FOLDER';
        pageNumber?: number;
        pageSize?: number;
    } = {}) => {
        return this.requestBecOpenApi('/', 'GET', { action: 'DescribeDatasets', ...query }, {}, this.v2Headers);
    };

    /**
     * 获取数据集详情
     * @param datasetId 数据集ID
     */
    DescribeDataset = async (datasetId: string) => {
        return this.requestBecOpenApi('/', 'GET', {
            action: 'DescribeDataset',
            datasetId
        }, {}, this.v2Headers);
    };

    /**
     * 获取数据集版本列表
     * @param datasetId 数据集ID
     * @param pageNumber 页码
     * @param pageSize 每页大小
     */
    DescribeDatasetVersions = async (datasetId: string, pageNumber?: number, pageSize?: number) => {
        return this.requestBecOpenApi('/', 'GET', {
            action: 'DescribeDatasetVersions',
            datasetId,
            pageNumber,
            pageSize
        }, {}, this.v2Headers);
    };

}

export { BceAihc };
