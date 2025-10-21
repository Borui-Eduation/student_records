import { router, adminProcedure } from '../trpc';
import { ExportExpensesSchema } from '@professional-workspace/shared';
import * as admin from 'firebase-admin';

export const expenseExportRouter = router({
  /**
   * 导出费用数据
   */
  export: adminProcedure.input(ExportExpensesSchema).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('expenses');

    // 只查询用户自己的数据
    query = query.where('userId', '==', ctx.user.uid);

    // 日期范围筛选（如果提供）
    if (input.dateRange) {
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));
    }

    // 按分类筛选（如果提供）
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    // 按日期排序
    query = query.orderBy('date', 'desc');

    const snapshot = await query.get();

    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date?.toDate().toISOString(),
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        categoryName: data.categoryName,
        description: data.description,
        merchant: data.merchant,
        paymentMethod: data.paymentMethod,
        tags: data.tags,
        clientId: data.clientId,
        clientName: data.clientName,
        notes: data.notes,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    // 根据格式返回数据
    if (input.format === 'csv') {
      // 生成CSV格式
      const headers = [
        '日期',
        '金额',
        '货币',
        '分类',
        '描述',
        '商家',
        '支付方式',
        '标签',
        '客户',
        '备注',
        '创建时间',
      ];

      const rows = expenses.map(exp => [
        exp.date?.split('T')[0] || '',
        exp.amount?.toString() || '',
        exp.currency || '',
        exp.categoryName || '',
        exp.description || '',
        exp.merchant || '',
        exp.paymentMethod || '',
        (exp.tags || []).join('; ') || '',
        exp.clientName || '',
        exp.notes || '',
        exp.createdAt?.split('T')[0] || '',
      ]);

      // 转义CSV字段
      const escapeCsvField = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      const csvContent = [
        headers.map(escapeCsvField).join(','),
        ...rows.map(row => row.map(escapeCsvField).join(',')),
      ].join('\n');

      return {
        format: 'csv',
        data: csvContent,
        filename: `expenses_${new Date().toISOString().split('T')[0]}.csv`,
        count: expenses.length,
      };
    }

    // 默认返回JSON格式
    return {
      format: 'json',
      data: JSON.stringify(expenses, null, 2),
      filename: `expenses_${new Date().toISOString().split('T')[0]}.json`,
      count: expenses.length,
    };
  }),

  /**
   * 获取导出统计（用于显示导出前的预览）
   */
  getExportPreview: adminProcedure.input(ExportExpensesSchema.omit({ format: true })).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('expenses');

    query = query.where('userId', '==', ctx.user.uid);

    if (input.dateRange) {
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));
    }

    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    const snapshot = await query.get();

    const expenses = snapshot.docs.map(doc => doc.data());
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return {
      count: expenses.length,
      totalAmount,
      currency: expenses[0]?.currency || 'CNY',
    };
  }),
});




