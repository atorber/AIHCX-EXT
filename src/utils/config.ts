/**
 * 插件全局配置管理
 */

export interface PluginConfig {
  ak: string;
  sk: string;
  host: string;
}

// 默认配置
const DEFAULT_CONFIG: PluginConfig = {
  ak: '',
  sk: '',
  host: 'aihc.bj.baidubce.com'
};

// 配置存储键
const CONFIG_STORAGE_KEY = 'aihc_plugin_config';

/**
 * 获取插件配置
 */
export const getPluginConfig = async (): Promise<PluginConfig> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
      return result[CONFIG_STORAGE_KEY] || DEFAULT_CONFIG;
    } else {
      // 在非扩展环境中使用localStorage
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('获取插件配置失败:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * 保存插件配置
 */
export const savePluginConfig = async (config: Partial<PluginConfig>): Promise<void> => {
  try {
    const currentConfig = await getPluginConfig();
    const newConfig = { ...currentConfig, ...config };
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [CONFIG_STORAGE_KEY]: newConfig });
    } else {
      // 在非扩展环境中使用localStorage
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    }
  } catch (error) {
    console.error('保存插件配置失败:', error);
    throw error;
  }
};

/**
 * 重置插件配置为默认值
 */
export const resetPluginConfig = async (): Promise<void> => {
  await savePluginConfig(DEFAULT_CONFIG);
};

/**
 * 验证配置是否完整
 */
export const validateConfig = (config: PluginConfig): boolean => {
  return !!(config.ak && config.sk && config.host);
};

/**
 * 获取配置状态
 */
export const getConfigStatus = async (): Promise<{
  isValid: boolean;
  hasAk: boolean;
  hasSk: boolean;
  hasHost: boolean;
  config: PluginConfig;
}> => {
  const config = await getPluginConfig();
  return {
    isValid: validateConfig(config),
    hasAk: !!config.ak,
    hasSk: !!config.sk,
    hasHost: !!config.host,
    config
  };
};
