import { Timestamp } from './common';

// 预设费用分类类型（字符串联合）
export type ExpenseCategoryType = 
  | 'dining'           // 餐饮
  | 'transportation'   // 交通
  | 'automobile'       // 汽车（加油、保养、车贷等）
  | 'housing'          // 住房（房租、水电、物业等）
  | 'entertainment'    // 娱乐
  | 'shopping'         // 购物
  | 'healthcare'       // 医疗
  | 'education'        // 教育
  | 'other';           // 其他

// 支付方式
export type PaymentMethod = 
  | 'cash'             // 现金
  | 'credit_card'      // 信用卡
  | 'debit_card'       // 借记卡
  | 'alipay'           // 支付宝
  | 'wechat'           // 微信支付
  | 'other';           // 其他

export interface Expense {
  id: string;
  userId: string;                    // 所属用户
  date: Timestamp;                   // 费用日期
  amount: number;                    // 金额
  currency: string;                  // 货币（默认CNY）
  category: string;                  // 分类（可以是预设或自定义分类ID）
  categoryName: string;              // 分类名称（冗余字段，便于显示）
  description: string;               // 描述
  merchant?: string;                 // 商家名称
  paymentMethod?: PaymentMethod;     // 支付方式
  imageUrl?: string;                 // 图片URL（原图）
  thumbnailUrl?: string;             // 缩略图URL
  tags?: string[];                   // 标签
  clientId?: string;                 // 关联客户（可选）
  clientName?: string;               // 客户名称（冗余）
  notes?: string;                    // 备注
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// 费用统计
export interface ExpenseStatistics {
  totalAmount: number;               // 总金额
  count: number;                     // 记录数
  averageAmount: number;             // 平均金额
  maxAmount: number;                 // 最大单笔
  minAmount: number;                 // 最小单笔
  categoryBreakdown: CategoryStat[]; // 分类统计
  monthlyTrend: MonthlyTrendStat[];  // 月度趋势
  paymentMethodBreakdown: PaymentMethodStat[]; // 支付方式统计
}

export interface CategoryStat {
  category: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrendStat {
  month: string;        // YYYY-MM
  amount: number;
  count: number;
}

export interface PaymentMethodStat {
  paymentMethod: PaymentMethod;
  amount: number;
  count: number;
  percentage: number;
}

