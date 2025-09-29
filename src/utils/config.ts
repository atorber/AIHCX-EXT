/**
 * 插件全局配置管理
 */

export interface PluginConfig {
  ak: string;
  sk: string;
  host: string;
}

export interface ConfigProfile {
  id: string;
  name: string;
  ak: string;
  sk: string;
  host: string;
  createdAt: number;
  updatedAt: number;
}

export interface MultiConfigManager {
  profiles: ConfigProfile[];
  activeProfileId: string | null;
  version: string;
}

// 默认配置
const DEFAULT_CONFIG: PluginConfig = {
  ak: '',
  sk: '',
  host: 'aihc.bj.baidubce.com'
};

// 配置存储键
const CONFIG_STORAGE_KEY = 'aihc_plugin_config';
const MULTI_CONFIG_STORAGE_KEY = 'aihc_multi_config_manager';

// 默认多配置管理器
const DEFAULT_MULTI_CONFIG: MultiConfigManager = {
  profiles: [],
  activeProfileId: null,
  version: '1.0.0'
};

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

// ==================== 多配置管理功能 ====================

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 获取多配置管理器
 */
export const getMultiConfigManager = async (): Promise<MultiConfigManager> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(MULTI_CONFIG_STORAGE_KEY);
      return result[MULTI_CONFIG_STORAGE_KEY] || DEFAULT_MULTI_CONFIG;
    } else {
      const stored = localStorage.getItem(MULTI_CONFIG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_MULTI_CONFIG;
    }
  } catch (error) {
    console.error('获取多配置管理器失败:', error);
    return DEFAULT_MULTI_CONFIG;
  }
};

/**
 * 保存多配置管理器
 */
export const saveMultiConfigManager = async (manager: MultiConfigManager): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [MULTI_CONFIG_STORAGE_KEY]: manager });
    } else {
      localStorage.setItem(MULTI_CONFIG_STORAGE_KEY, JSON.stringify(manager));
    }
  } catch (error) {
    console.error('保存多配置管理器失败:', error);
    throw error;
  }
};

/**
 * 添加配置档案
 */
export const addConfigProfile = async (profile: Omit<ConfigProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigProfile> => {
  const manager = await getMultiConfigManager();
  const newProfile: ConfigProfile = {
    ...profile,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  manager.profiles.push(newProfile);
  await saveMultiConfigManager(manager);
  
  return newProfile;
};

/**
 * 更新配置档案
 */
export const updateConfigProfile = async (id: string, updates: Partial<Omit<ConfigProfile, 'id' | 'createdAt'>>): Promise<void> => {
  const manager = await getMultiConfigManager();
  const profileIndex = manager.profiles.findIndex(p => p.id === id);
  
  if (profileIndex === -1) {
    throw new Error('配置档案不存在');
  }
  
  manager.profiles[profileIndex] = {
    ...manager.profiles[profileIndex],
    ...updates,
    updatedAt: Date.now()
  };
  
  await saveMultiConfigManager(manager);
};

/**
 * 删除配置档案
 */
export const deleteConfigProfile = async (id: string): Promise<void> => {
  const manager = await getMultiConfigManager();
  manager.profiles = manager.profiles.filter(p => p.id !== id);
  
  // 如果删除的是当前激活的配置，清除激活状态
  if (manager.activeProfileId === id) {
    manager.activeProfileId = null;
  }
  
  await saveMultiConfigManager(manager);
};

/**
 * 设置激活的配置档案
 */
export const setActiveConfigProfile = async (id: string): Promise<void> => {
  const manager = await getMultiConfigManager();
  const profile = manager.profiles.find(p => p.id === id);
  
  if (!profile) {
    throw new Error('配置档案不存在');
  }
  
  manager.activeProfileId = id;
  await saveMultiConfigManager(manager);
  
  // 同时更新当前配置
  await savePluginConfig({
    ak: profile.ak,
    sk: profile.sk,
    host: profile.host
  });
};

/**
 * 获取当前激活的配置档案
 */
export const getActiveConfigProfile = async (): Promise<ConfigProfile | null> => {
  const manager = await getMultiConfigManager();
  if (!manager.activeProfileId) {
    return null;
  }
  
  return manager.profiles.find(p => p.id === manager.activeProfileId) || null;
};

/**
 * 验证配置档案
 */
export const validateConfigProfile = (profile: ConfigProfile): boolean => {
  return !!(profile.name && profile.ak && profile.sk && profile.host);
};
