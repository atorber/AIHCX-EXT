import React, { useState, useEffect } from 'react';
import { 
  ConfigProfile, 
  MultiConfigManager,
  getMultiConfigManager,
  addConfigProfile,
  updateConfigProfile,
  deleteConfigProfile,
  setActiveConfigProfile,
  getActiveConfigProfile,
  validateConfigProfile
} from '../utils/config';
import { callBecOpenApi } from '../utils/aihcOpenApi';

interface MultiConfigManagerProps {
  onConfigChange?: (profile: ConfigProfile | null) => void;
}

const MultiConfigManagerComponent: React.FC<MultiConfigManagerProps> = ({ onConfigChange }) => {
  const [manager, setManager] = useState<MultiConfigManager>({
    profiles: [],
    activeProfileId: null,
    version: '1.0.0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingProfile, setEditingProfile] = useState<ConfigProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    ak: '',
    sk: '',
    host: 'aihc.bj.baidubce.com'
  });

  // 加载配置管理器
  useEffect(() => {
    const loadManager = async () => {
      try {
        setIsLoading(true);
        const configManager = await getMultiConfigManager();
        setManager(configManager);
        
        if (onConfigChange) {
          const activeProfile = await getActiveConfigProfile();
          onConfigChange(activeProfile);
        }
      } catch (error) {
        console.error('加载配置管理器失败:', error);
        showMessage('error', '加载配置管理器失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadManager();
  }, [onConfigChange]);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 添加新配置档案
  const handleAddProfile = async () => {
    if (!newProfile.name.trim()) {
      showMessage('error', '请输入配置名称');
      return;
    }

    if (!newProfile.ak.trim() || !newProfile.sk.trim() || !newProfile.host.trim()) {
      showMessage('error', '请填写完整的配置信息');
      return;
    }

    try {
      setIsSaving(true);
      await addConfigProfile(newProfile);
      
      // 更新本地状态
      const updatedManager = await getMultiConfigManager();
      setManager(updatedManager);
      
      // 重置表单
      setNewProfile({
        name: '',
        ak: '',
        sk: '',
        host: 'aihc.bj.baidubce.com'
      });
      setShowAddForm(false);
      
      showMessage('success', '配置档案添加成功');
    } catch (error) {
      console.error('添加配置档案失败:', error);
      showMessage('error', '添加配置档案失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 编辑配置档案
  const handleEditProfile = (profile: ConfigProfile) => {
    setEditingProfile(profile);
  };

  // 保存编辑的配置档案
  const handleSaveEdit = async () => {
    if (!editingProfile) return;

    if (!editingProfile.name.trim()) {
      showMessage('error', '请输入配置名称');
      return;
    }

    if (!editingProfile.ak.trim() || !editingProfile.sk.trim() || !editingProfile.host.trim()) {
      showMessage('error', '请填写完整的配置信息');
      return;
    }

    try {
      setIsSaving(true);
      await updateConfigProfile(editingProfile.id, {
        name: editingProfile.name,
        ak: editingProfile.ak,
        sk: editingProfile.sk,
        host: editingProfile.host
      });
      
      // 更新本地状态
      const updatedManager = await getMultiConfigManager();
      setManager(updatedManager);
      
      setEditingProfile(null);
      showMessage('success', '配置档案更新成功');
    } catch (error) {
      console.error('更新配置档案失败:', error);
      showMessage('error', '更新配置档案失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除配置档案
  const handleDeleteProfile = async (id: string) => {
    if (!confirm('确定要删除这个配置档案吗？')) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteConfigProfile(id);
      
      // 更新本地状态
      const updatedManager = await getMultiConfigManager();
      setManager(updatedManager);
      
      showMessage('success', '配置档案删除成功');
    } catch (error) {
      console.error('删除配置档案失败:', error);
      showMessage('error', '删除配置档案失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 设置激活配置档案
  const handleSetActive = async (id: string) => {
    try {
      setIsSaving(true);
      await setActiveConfigProfile(id);
      
      // 更新本地状态
      const updatedManager = await getMultiConfigManager();
      setManager(updatedManager);
      
      if (onConfigChange) {
        const activeProfile = await getActiveConfigProfile();
        onConfigChange(activeProfile);
      }
      
      showMessage('success', '配置档案已激活');
    } catch (error) {
      console.error('设置激活配置档案失败:', error);
      showMessage('error', '设置激活配置档案失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 验证配置档案
  const handleValidateProfile = async (profile: ConfigProfile) => {
    if (!validateConfigProfile(profile)) {
      showMessage('error', '配置信息不完整');
      return;
    }

    try {
      setIsSaving(true);
      showMessage('success', '正在验证配置...');
      
      // 调用DescribeDatasets接口验证配置
      const path = '/';
      const method = 'GET';
      const query = {
        action: 'DescribeDatasets',
      };
      const headers = {
        version: 'v2',
      };
      const body = {};

      const result = await callBecOpenApi(profile.ak, profile.sk, profile.host, path, method, query, body, headers);
      
      // 检查返回结果
      if (result && !result.error && !result.statusCode) {
        showMessage('success', '配置验证成功！API连接正常');
        console.log('验证成功，返回结果:', result);
      } else {
        const errorMessage = result?.message || result?.error?.message || '未知错误';
        showMessage('error', `配置验证失败: ${errorMessage}`);
        console.error('验证失败:', result);
      }
    } catch (error: any) {
      console.error('配置验证失败:', error);
      const errorMessage = error?.message || error?.toString() || '网络请求失败';
      showMessage('error', `配置验证失败: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="config-form">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载配置管理器...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-form">
      <div className="config-header">
        <h3>多配置管理</h3>
        <div className="config-status">
          <span className="status-indicator">
            📋 {manager.profiles.length} 个配置档案
          </span>
        </div>
      </div>

      {message && (
        <div className={`config-message ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : '❌'}
          </span>
          {message.text}
        </div>
      )}

      {/* 添加新配置表单 */}
      {showAddForm && (
        <div className="config-profile-form">
          <h4>添加新配置档案</h4>
          <div className="config-field-group">
            <label htmlFor="profile-name">配置名称 *</label>
            <input
              id="profile-name"
              type="text"
              value={newProfile.name}
              onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入配置名称，如：生产环境"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="profile-ak">Access Key (AK) *</label>
            <input
              id="profile-ak"
              type="text"
              value={newProfile.ak}
              onChange={(e) => setNewProfile(prev => ({ ...prev, ak: e.target.value }))}
              placeholder="请输入您的Access Key"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="profile-sk">Secret Key (SK) *</label>
            <input
              id="profile-sk"
              type="password"
              value={newProfile.sk}
              onChange={(e) => setNewProfile(prev => ({ ...prev, sk: e.target.value }))}
              placeholder="请输入您的Secret Key"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="profile-host">API Host *</label>
            <input
              id="profile-host"
              type="text"
              value={newProfile.host}
              onChange={(e) => setNewProfile(prev => ({ ...prev, host: e.target.value }))}
              placeholder="请输入API主机地址"
            />
          </div>
          <div className="config-actions">
            <button
              type="button"
              onClick={handleAddProfile}
              disabled={isSaving}
              className="config-btn config-btn-primary"
            >
              {isSaving ? '添加中...' : '添加配置'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="config-btn config-btn-outline"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 配置档案列表 */}
      <div className="config-profiles-list">
        {manager.profiles.length === 0 ? (
          <div className="empty-state">
            <p>暂无配置档案</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="config-btn config-btn-primary"
            >
              添加第一个配置档案
            </button>
          </div>
        ) : (
          <>
            <div className="profiles-header">
              <h4>配置档案列表</h4>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="config-btn config-btn-secondary"
              >
                + 添加配置
              </button>
            </div>
            {manager.profiles.map((profile) => (
              <div key={profile.id} className={`config-profile-item ${manager.activeProfileId === profile.id ? 'active' : ''}`}>
                <div className="profile-header">
                  <div className="profile-info">
                    <h5>{profile.name}</h5>
                    <span className="profile-host">{profile.host}</span>
                    {manager.activeProfileId === profile.id && (
                      <span className="active-badge">当前激活</span>
                    )}
                  </div>
                  <div className="profile-actions">
                    <button
                      type="button"
                      onClick={() => handleValidateProfile(profile)}
                      disabled={isSaving}
                      className="config-btn config-btn-small"
                    >
                      验证
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditProfile(profile)}
                      className="config-btn config-btn-small"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetActive(profile.id)}
                      disabled={isSaving || manager.activeProfileId === profile.id}
                      className="config-btn config-btn-small config-btn-primary"
                    >
                      激活
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile.id)}
                      disabled={isSaving}
                      className="config-btn config-btn-small config-btn-danger"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="profile-details">
                  <div className="profile-field">
                    <span className="field-label">AK:</span>
                    <span className="field-value">{profile.ak.substring(0, 8)}...</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">SK:</span>
                    <span className="field-value">{profile.sk.substring(0, 8)}...</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">更新时间:</span>
                    <span className="field-value">{new Date(profile.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 编辑配置档案模态框 */}
      {editingProfile && (
        <div className="config-profile-form">
          <h4>编辑配置档案</h4>
          <div className="config-field-group">
            <label htmlFor="edit-profile-name">配置名称 *</label>
            <input
              id="edit-profile-name"
              type="text"
              value={editingProfile.name}
              onChange={(e) => setEditingProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="请输入配置名称"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="edit-profile-ak">Access Key (AK) *</label>
            <input
              id="edit-profile-ak"
              type="text"
              value={editingProfile.ak}
              onChange={(e) => setEditingProfile(prev => prev ? { ...prev, ak: e.target.value } : null)}
              placeholder="请输入您的Access Key"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="edit-profile-sk">Secret Key (SK) *</label>
            <input
              id="edit-profile-sk"
              type="password"
              value={editingProfile.sk}
              onChange={(e) => setEditingProfile(prev => prev ? { ...prev, sk: e.target.value } : null)}
              placeholder="请输入您的Secret Key"
            />
          </div>
          <div className="config-field-group">
            <label htmlFor="edit-profile-host">API Host *</label>
            <input
              id="edit-profile-host"
              type="text"
              value={editingProfile.host}
              onChange={(e) => setEditingProfile(prev => prev ? { ...prev, host: e.target.value } : null)}
              placeholder="请输入API主机地址"
            />
          </div>
          <div className="config-actions">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="config-btn config-btn-primary"
            >
              {isSaving ? '保存中...' : '保存修改'}
            </button>
            <button
              type="button"
              onClick={() => setEditingProfile(null)}
              className="config-btn config-btn-outline"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="config-info">
        <h4>多配置管理说明</h4>
        <ul>
          <li><strong>配置档案</strong>: 可以创建多个配置档案，每个档案包含独立的AK、SK和Host</li>
          <li><strong>激活配置</strong>: 只能有一个配置档案处于激活状态，激活的配置将用于API调用</li>
          <li><strong>配置验证</strong>: 可以单独验证每个配置档案的API连接是否正常</li>
          <li><strong>配置管理</strong>: 支持添加、编辑、删除和切换配置档案</li>
          <li><strong>数据安全</strong>: 所有配置信息都安全存储在浏览器本地</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiConfigManagerComponent;
