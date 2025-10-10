"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSessionsSchema = exports.UpdateSessionSchema = exports.CreateSessionSchema = exports.ContentBlockSchema = exports.BillingStatusSchema = exports.SessionTypeSchema = void 0;
const zod_1 = require("zod");
exports.SessionTypeSchema = zod_1.z.enum(['education', 'technical']);
exports.BillingStatusSchema = zod_1.z.enum(['unbilled', 'billed', 'paid']);
exports.ContentBlockSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['heading', 'paragraph', 'bulletList', 'orderedList', 'codeBlock', 'image', 'link']),
    content: zod_1.z.any(),
    order: zod_1.z.number(),
});
exports.CreateSessionSchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    date: zod_1.z.string().or(zod_1.z.date()),
    startTime: zod_1.z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: zod_1.z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    sessionType: exports.SessionTypeSchema,
    contentBlocks: zod_1.z.array(exports.ContentBlockSchema).optional(),
});
exports.UpdateSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    date: zod_1.z.string().or(zod_1.z.date()).optional(),
    startTime: zod_1.z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: zod_1.z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    sessionType: exports.SessionTypeSchema.optional(),
    contentBlocks: zod_1.z.array(exports.ContentBlockSchema).optional(),
});
exports.ListSessionsSchema = zod_1.z.object({
    clientId: zod_1.z.string().optional(),
    billingStatus: exports.BillingStatusSchema.optional(),
    sessionType: exports.SessionTypeSchema.optional(),
    dateRange: zod_1.z.object({
        start: zod_1.z.string().or(zod_1.z.date()),
        end: zod_1.z.string().or(zod_1.z.date()),
    }).optional(),
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
    cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=session.js.map