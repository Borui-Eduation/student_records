import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ListExpensesSchema,
  GetStatisticsSchema,
  BatchDeleteExpensesSchema,
} from '@professional-workspace/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { cleanUndefinedValues } from '../services/firestoreHelpers';
import { 
  processImage, 
  base64ToBuffer, 
  validateImageSize, 
  validateImageFormat 
} from '../services/imageProcessor';
import { 
  uploadExpenseImages, 
  deleteAllExpenseImages 
} from '../services/storageService';
import { nanoid } from 'nanoid';

// Helper function to format date based on granularity
// Uses UTC to avoid timezone issues
function formatDateKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  switch (granularity) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week':
      // Get ISO week number using UTC
      const onejan = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
      return `${year}-W${String(weekNum).padStart(2, '0')}`;
    case 'month':
    default:
      return `${year}-${month}`;
  }
}

export const expensesRouter = router({
  /**
   * 创建费用记录
   */
  create: adminProcedure.input(CreateExpenseSchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();
    const expenseId = nanoid();

    // 获取分类信息
    let categoryName = '';
    if (input.category) {
      const categoryDoc = await ctx.db.collection('expenseCategories').doc(input.category).get();
      if (categoryDoc.exists) {
        categoryName = categoryDoc.data()?.name || '';
      }
    }

    // 获取客户信息（如果有关联）
    let clientName = '';
    if (input.clientId) {
      const clientDoc = await ctx.db.collection('clients').doc(input.clientId).get();
      if (clientDoc.exists) {
        clientName = clientDoc.data()?.name || '';
      }
    }

    // 处理图片上传
    let imageUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    let imagePath: string | undefined;
    let thumbnailPath: string | undefined;

    if (input.imageData) {
      try {
        // 转换Base64到Buffer
        const imageBuffer = base64ToBuffer(input.imageData);

        // 验证图片大小（最大10MB）
        if (!validateImageSize(imageBuffer, 10)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '图片大小不能超过10MB',
          });
        }

        // 验证图片格式
        const isValidFormat = await validateImageFormat(imageBuffer);
        if (!isValidFormat) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '不支持的图片格式，仅支持 JPG、PNG、WEBP、GIF',
          });
        }

        // 处理图片
        const processed = await processImage(imageBuffer);

        // 上传到Storage
        const uploadResult = await uploadExpenseImages(
          ctx.user.uid,
          expenseId,
          processed.fullImage,
          processed.thumbnail,
          processed.contentType
        );

        imageUrl = uploadResult.fullImageUrl;
        thumbnailUrl = uploadResult.thumbnailUrl;
        imagePath = uploadResult.filePath;
        thumbnailPath = uploadResult.thumbnailPath;
      } catch (error) {
        console.error('❌ Error processing expense image:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `图片处理失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // 创建费用记录
    // Parse date in local timezone to avoid UTC conversion issues
    const [year, month, day] = input.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid timezone edge cases
    
    const expenseData = {
      userId: ctx.user.uid,
      date: admin.firestore.Timestamp.fromDate(localDate),
      amount: input.amount,
      currency: input.currency || 'CNY',
      category: input.category,
      categoryName,
      description: input.description,
      merchant: input.merchant || null,
      paymentMethod: input.paymentMethod || null,
      imageUrl: imageUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      imagePath: imagePath || null,
      thumbnailPath: thumbnailPath || null,
      tags: input.tags || [],
      clientId: input.clientId || null,
      clientName: clientName || null,
      notes: input.notes || null,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    };

    await ctx.db.collection('expenses').doc(expenseId).set(cleanUndefinedValues(expenseData));

    return {
      id: expenseId,
      ...expenseData,
    };
  }),

  /**
   * 获取单个费用记录
   */
  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const doc = await ctx.db.collection('expenses').doc(input.id).get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '费用记录不存在',
      });
    }

    const data = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权访问此费用记录',
      });
    }

    return {
      id: doc.id,
      ...data,
    };
  }),

  /**
   * 列出费用记录
   */
  list: adminProcedure.input(ListExpensesSchema).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('expenses');

    // 只查询用户自己的数据
    query = query.where('userId', '==', ctx.user.uid);

    // 按分类筛选
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    // 按支付方式筛选
    if (input.paymentMethod) {
      query = query.where('paymentMethod', '==', input.paymentMethod);
    }

    // 按客户筛选
    if (input.clientId) {
      query = query.where('clientId', '==', input.clientId);
    }

    // 日期范围筛选
    if (input.dateRange) {
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));
    }

    // 排序
    const sortField = input.sortBy || 'date';
    const sortOrder = input.sortOrder || 'desc';
    query = query.orderBy(sortField, sortOrder);

    // 分页
    if (input.cursor) {
      const cursorDoc = await ctx.db.collection('expenses').doc(input.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const limit = input.limit || 50;
    query = query.limit(limit);

    const snapshot = await query.get();

    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 前端搜索过滤（Firestore不支持全文搜索）
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      items = items.filter((item: any) => 
        item.description?.toLowerCase().includes(searchLower) ||
        item.merchant?.toLowerCase().includes(searchLower)
      );
    }

    // 标签过滤
    if (input.tags && input.tags.length > 0) {
      items = items.filter((item: any) => 
        item.tags && item.tags.some((tag: string) => input.tags!.includes(tag))
      );
    }

    return {
      items,
      nextCursor: snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : undefined,
      hasMore: snapshot.docs.length === limit,
      total: items.length,
    };
  }),

  /**
   * 更新费用记录
   */
  update: adminProcedure.input(UpdateExpenseSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;
    const docRef = ctx.db.collection('expenses').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '费用记录不存在',
      });
    }

    const expenseData = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && expenseData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权修改此费用记录',
      });
    }

    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // 更新日期
    if (updates.date) {
      const [year, month, day] = updates.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      updateData.date = admin.firestore.Timestamp.fromDate(localDate);
    }

    // 更新基本字段
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency) updateData.currency = updates.currency;
    if (updates.description) updateData.description = updates.description;
    if (updates.merchant !== undefined) updateData.merchant = updates.merchant;
    if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // 更新分类
    if (updates.category) {
      updateData.category = updates.category;
      const categoryDoc = await ctx.db.collection('expenseCategories').doc(updates.category).get();
      if (categoryDoc.exists) {
        updateData.categoryName = categoryDoc.data()?.name || '';
      }
    }

    // 更新客户关联
    if (updates.clientId !== undefined) {
      updateData.clientId = updates.clientId;
      if (updates.clientId) {
        const clientDoc = await ctx.db.collection('clients').doc(updates.clientId).get();
        if (clientDoc.exists) {
          updateData.clientName = clientDoc.data()?.name || '';
        }
      } else {
        updateData.clientName = null;
      }
    }

    // 处理图片更新
    if (updates.removeImage) {
      // 删除旧图片
      if (expenseData?.imagePath || expenseData?.thumbnailPath) {
        await deleteAllExpenseImages(ctx.user.uid, id);
      }
      updateData.imageUrl = null;
      updateData.thumbnailUrl = null;
      updateData.imagePath = null;
      updateData.thumbnailPath = null;
    } else if (updates.imageData) {
      // 删除旧图片
      if (expenseData?.imagePath || expenseData?.thumbnailPath) {
        await deleteAllExpenseImages(ctx.user.uid, id);
      }

      // 上传新图片
      try {
        console.log('🖼️  Processing image update...', {
          imageDataLength: updates.imageData?.length || 0,
          imageDataPrefix: updates.imageData?.substring(0, 50) || '',
        });
        
        const imageBuffer = base64ToBuffer(updates.imageData);
        
        console.log('✅ Image buffer created:', {
          bufferSize: imageBuffer.length,
          bufferSizeMB: (imageBuffer.length / (1024 * 1024)).toFixed(2),
        });
        
        if (!validateImageSize(imageBuffer, 10)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '图片大小不能超过10MB',
          });
        }

        const isValidFormat = await validateImageFormat(imageBuffer);
        if (!isValidFormat) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '不支持的图片格式',
          });
        }

        const processed = await processImage(imageBuffer);
        const uploadResult = await uploadExpenseImages(
          ctx.user.uid,
          id,
          processed.fullImage,
          processed.thumbnail,
          processed.contentType
        );

        updateData.imageUrl = uploadResult.fullImageUrl;
        updateData.thumbnailUrl = uploadResult.thumbnailUrl;
        updateData.imagePath = uploadResult.filePath;
        updateData.thumbnailPath = uploadResult.thumbnailPath;
      } catch (error) {
        console.error('❌ Error updating expense image:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `图片处理失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    await docRef.update(cleanUndefinedValues(updateData));

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...updated.data(),
    };
  }),

  /**
   * 删除费用记录
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('expenses').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '费用记录不存在',
      });
    }

    const expenseData = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && expenseData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权删除此费用记录',
      });
    }

    // 删除关联的图片
    if (expenseData?.imagePath || expenseData?.thumbnailPath) {
      await deleteAllExpenseImages(ctx.user.uid, input.id);
    }

    await docRef.delete();

    return { success: true };
  }),

  /**
   * 批量删除费用记录
   */
  batchDelete: adminProcedure.input(BatchDeleteExpensesSchema).mutation(async ({ ctx, input }) => {
    const deletePromises = input.ids.map(async (id) => {
      const docRef = ctx.db.collection('expenses').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return { id, success: false, error: '记录不存在' };
      }

      const expenseData = doc.data();

      // 检查所有权
      if (ctx.userRole !== 'superadmin' && expenseData?.userId !== ctx.user.uid) {
        return { id, success: false, error: '无权删除' };
      }

      // 删除图片
      if (expenseData?.imagePath || expenseData?.thumbnailPath) {
        await deleteAllExpenseImages(ctx.user.uid, id);
      }

      await docRef.delete();
      return { id, success: true };
    });

    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.success).length;

    return {
      total: input.ids.length,
      successCount,
      results,
    };
  }),

  /**
   * 获取统计数据
   */
  getStatistics: adminProcedure.input(GetStatisticsSchema).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('expenses');

    // 只查询用户自己的数据
    query = query.where('userId', '==', ctx.user.uid);

    // 日期范围筛选
    query = query
      .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));

    // 按分类筛选（可选）
    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    const snapshot = await query.get();

    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // 计算统计数据
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const count = expenses.length;
    const averageAmount = count > 0 ? totalAmount / count : 0;
    const maxAmount = count > 0 ? Math.max(...expenses.map(e => e.amount || 0)) : 0;
    const minAmount = count > 0 ? Math.min(...expenses.map(e => e.amount || 0)) : 0;

    // 分类统计
    const categoryMap = new Map<string, { amount: number; count: number; name: string }>();
    expenses.forEach(exp => {
      const cat = exp.category || 'other';
      const existing = categoryMap.get(cat) || { amount: 0, count: 0, name: exp.categoryName || '未分类' };
      existing.amount += exp.amount || 0;
      existing.count += 1;
      categoryMap.set(cat, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      categoryName: data.name,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));

    // 趋势数据 (按 granularity 分组)
    const granularity = input.granularity || 'month';
    const periodMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach(exp => {
      const date = exp.date?.toDate();
      if (date && date instanceof Date && !isNaN(date.getTime())) {
        const periodKey = formatDateKey(date, granularity);
        const existing = periodMap.get(periodKey) || { amount: 0, count: 0 };
        existing.amount += exp.amount || 0;
        existing.count += 1;
        periodMap.set(periodKey, existing);
      }
    });

    const monthlyTrend = Array.from(periodMap.entries())
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    console.log('API getStatistics result:', {
      granularity,
      months: monthlyTrend.map(d => d.month),
      dataPoints: monthlyTrend.length,
    });

    // 支付方式统计
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach(exp => {
      const method = exp.paymentMethod || 'other';
      const existing = paymentMethodMap.get(method) || { amount: 0, count: 0 };
      existing.amount += exp.amount || 0;
      existing.count += 1;
      paymentMethodMap.set(method, existing);
    });

    const paymentMethodBreakdown = Array.from(paymentMethodMap.entries()).map(([paymentMethod, data]) => ({
      paymentMethod,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));

    return {
      totalAmount,
      count,
      averageAmount,
      maxAmount,
      minAmount,
      categoryBreakdown,
      monthlyTrend,
      paymentMethodBreakdown,
    };
  }),
});

