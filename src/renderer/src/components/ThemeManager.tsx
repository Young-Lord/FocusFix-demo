import React, { useState } from 'react';

interface Theme {
  id: number;
  category: string;
  subcategory: string;
  specific: string;
}

interface ThemeManagerProps {
  themes: Theme[];
  onThemesChange: (themes: Theme[]) => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ themes, onThemesChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    specific: ''
  });

  const openAddModal = () => {
    setEditingTheme(null);
    setFormData({ category: '', subcategory: '', specific: '' });
    setShowAddModal(true);
  };

  const openEditModal = (theme: Theme) => {
    setEditingTheme(theme);
    setFormData({
      category: theme.category,
      subcategory: theme.subcategory,
      specific: theme.specific
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTheme(null);
    setFormData({ category: '', subcategory: '', specific: '' });
  };

  const handleSubmit = () => {
    if (!formData.category.trim() || !formData.subcategory.trim() || !formData.specific.trim()) {
      alert('请填写所有字段');
      return;
    }

    if (editingTheme) {
      // 编辑现有主题
      const updatedThemes = themes.map(theme =>
        theme.id === editingTheme.id
          ? { ...theme, ...formData }
          : theme
      );
      onThemesChange(updatedThemes);
    } else {
      // 添加新主题
      const newTheme: Theme = {
        id: Date.now(),
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim(),
        specific: formData.specific.trim()
      };
      onThemesChange([...themes, newTheme]);
    }

    closeModal();
  };

  const deleteTheme = (id: number) => {
    if (window.confirm('确定要删除这个主题吗？')) {
      const updatedThemes = themes.filter(theme => theme.id !== id);
      onThemesChange(updatedThemes);
    }
  };

  // 按分类分组主题
  const groupedThemes = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, Theme[]>);

  return (
    <>
      <div className="card">
        <h3>🏷️ 主题管理</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          管理用于AI分析的主题分类。主题采用三级结构：大类 → 小类 → 具体。
        </p>
        <button className="btn" onClick={openAddModal}>
          ➕ 添加主题
        </button>
      </div>

      <div id="themesList">
        {Object.entries(groupedThemes).map(([category, categoryThemes]) => (
          <div key={category} className="card">
            <h3>{category} ({categoryThemes.length}个主题)</h3>
            {categoryThemes.map(theme => (
              <div key={theme.id} className="theme-item">
                <div className="theme-info">
                  <div className="theme-category">{theme.category}</div>
                  <div className="theme-subcategory">{theme.subcategory}</div>
                  <div className="theme-specific">{theme.specific}</div>
                </div>
                <div className="theme-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => openEditModal(theme)}
                  >
                    编辑
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => deleteTheme(theme.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 添加/编辑主题模态框 */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingTheme ? '编辑主题' : '添加主题'}</h2>
              <span className="close" onClick={closeModal}>&times;</span>
            </div>
            <div className="form-group">
              <label>大类：</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="例如：学习、工作、娱乐、生活" 
              />
            </div>
            <div className="form-group">
              <label>小类：</label>
              <input 
                type="text" 
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                placeholder="例如：编程、阅读、会议、游戏" 
              />
            </div>
            <div className="form-group">
              <label>具体：</label>
              <input 
                type="text" 
                value={formData.specific}
                onChange={(e) => setFormData(prev => ({ ...prev, specific: e.target.value }))}
                placeholder="例如：Python、技术文档、团队会议、我的世界" 
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={closeModal}>
                取消
              </button>
              <button className="btn" onClick={handleSubmit}>
                {editingTheme ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeManager;
