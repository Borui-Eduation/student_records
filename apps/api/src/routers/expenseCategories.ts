import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  CreateExpenseCategorySchema,
  UpdateExpenseCategorySchema,
  ListExpenseCategoriesSchema,
  PRESET_CATEGORIES,
} from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const expenseCategoriesRouter = router({
  /**
   * 初始化系统预设分类（用户首次使用时调用）
   */
  initializePresets: adminProcedure.mutation(async ({ ctx }) => {
    const now = admin.firestore.Timestamp.now();
    const batch = ctx.db.batch();

    // 检查是否已经初始化过
    const existingPresets = await ctx.db
      .collection('expenseCategories')
      .where('userId', '==', ctx.user.uid)
      .where('isSystemPreset', '==', true)
      .limit(1)
      .get();

    if (!existingPresets.empty) {
      return { message: '预设分类已存在', count: 0 };
    }

    // 创建预设分类
    let count = 0;
    for (const preset of PRESET_CATEGORIES) {
      const docRef = ctx.db.collection('expenseCategories').doc();
      batch.set(docRef, {
        userId: ctx.user.uid,
        name: preset.name,
        icon: preset.icon,
        color: preset.color,
        isSystemPreset: true,
        order: count,
        presetId: preset.id, // 保存预设ID便于识别
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    await batch.commit();

    return { message: '预设分类初始化成功', count };
  }),

  /**
   * 创建自定义分类
   */
  create: adminProcedure.input(CreateExpenseCategorySchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    // 检查同名分类是否存在
    const existing = await ctx.db
      .collection('expenseCategories')
      .where('userId', '==', ctx.user.uid)
      .where('name', '==', input.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '同名分类已存在',
      });
    }

    const categoryData = {
      userId: ctx.user.uid,
      name: input.name,
      icon: input.icon || '📋',
      color: input.color || '#BDB2FF',
      isSystemPreset: false,
      order: input.order !== undefined ? input.order : 999,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await ctx.db.collection('expenseCategories').add(categoryData);

    return {
      id: docRef.id,
      ...categoryData,
    };
  }),

  /**
   * 获取单个分类
   */
  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const doc = await ctx.db.collection('expenseCategories').doc(input.id).get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '分类不存在',
      });
    }

    const data = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权访问此分类',
      });
    }

    return {
      id: doc.id,
      ...data,
    };
  }),

  /**
   * 列出所有分类
   */
  list: adminProcedure.input(ListExpenseCategoriesSchema).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('expenseCategories');

    // 只查询用户自己的分类
    query = query.where('userId', '==', ctx.user.uid);

    // 排序
    const sortBy = input.sortBy || 'order';
    query = query.orderBy(sortBy, 'asc');

    const snapshot = await query.get();

    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 如果不包含系统预设，则过滤掉
    if (!input.includeSystemPresets) {
      items = items.filter((item: any) => !item.isSystemPreset);
    }

    return {
      items,
      total: items.length,
    };
  }),

  /**
   * 更新分类
   */
  update: adminProcedure.input(UpdateExpenseCategorySchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;
    const docRef = ctx.db.collection('expenseCategories').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '分类不存在',
      });
    }

    const categoryData = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && categoryData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权修改此分类',
      });
    }

    // 不允许修改系统预设分类
    if (categoryData?.isSystemPreset) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '不能修改系统预设分类',
      });
    }

    // 检查新名称是否与其他分类重复
    if (updates.name) {
      const existing = await ctx.db
        .collection('expenseCategories')
        .where('userId', '==', ctx.user.uid)
        .where('name', '==', updates.name)
        .limit(1)
        .get();

      if (!existing.empty && existing.docs[0].id !== id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '同名分类已存在',
        });
      }
    }

    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.icon) updateData.icon = updates.icon;
    if (updates.color) updateData.color = updates.color;
    if (updates.order !== undefined) updateData.order = updates.order;

    await docRef.update(updateData);

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...updated.data(),
    };
  }),

  /**
   * 删除分类
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('expenseCategories').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '分类不存在',
      });
    }

    const categoryData = doc.data();

    // 检查所有权
    if (ctx.userRole !== 'superadmin' && categoryData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '无权删除此分类',
      });
    }

    // 不允许删除系统预设分类
    if (categoryData?.isSystemPreset) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '不能删除系统预设分类',
      });
    }

    // 检查是否有费用使用此分类
    const expensesWithCategory = await ctx.db
      .collection('expenses')
      .where('userId', '==', ctx.user.uid)
      .where('category', '==', input.id)
      .limit(1)
      .get();

    if (!expensesWithCategory.empty) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '该分类下还有费用记录，不能删除',
      });
    }

    await docRef.delete();

    return { success: true };
  }),
});

