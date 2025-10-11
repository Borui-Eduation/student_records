import { Timestamp } from './common';

export interface ExpenseCategory {
  id: string;
  userId: string;           // 所属用户
  name: string;             // 分类名称
  icon?: string;            // 图标（emoji或图标名称）
  color?: string;           // 颜色（hex格式）
  isSystemPreset: boolean;  // 是否为系统预设分类
  order?: number;           // 排序顺序
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 预设分类配置
export interface PresetCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
}

// 系统预设分类
export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'dining',
    name: '餐饮',
    nameEn: 'Dining',
    icon: '🍽️',
    color: '#FF6B6B'
  },
  {
    id: 'transportation',
    name: '交通',
    nameEn: 'Transportation',
    icon: '🚗',
    color: '#4ECDC4'
  },
  {
    id: 'automobile',
    name: '汽车',
    nameEn: 'Automobile',
    icon: '⛽',
    color: '#95E1D3'
  },
  {
    id: 'housing',
    name: '住房',
    nameEn: 'Housing',
    icon: '🏠',
    color: '#FFE66D'
  },
  {
    id: 'entertainment',
    name: '娱乐',
    nameEn: 'Entertainment',
    icon: '🎮',
    color: '#A8E6CF'
  },
  {
    id: 'shopping',
    name: '购物',
    nameEn: 'Shopping',
    icon: '🛍️',
    color: '#FFD3B6'
  },
  {
    id: 'healthcare',
    name: '医疗',
    nameEn: 'Healthcare',
    icon: '💊',
    color: '#FFAAA5'
  },
  {
    id: 'education',
    name: '教育',
    nameEn: 'Education',
    icon: '📚',
    color: '#A0C4FF'
  },
  {
    id: 'other',
    name: '其他',
    nameEn: 'Other',
    icon: '📋',
    color: '#BDB2FF'
  }
];

