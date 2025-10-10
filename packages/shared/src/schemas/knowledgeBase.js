"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchKnowledgeSchema = exports.UpdateKnowledgeEntrySchema = exports.CreateKnowledgeEntrySchema = exports.KnowledgeTypeSchema = void 0;
const zod_1 = require("zod");
exports.KnowledgeTypeSchema = zod_1.z.enum(['note', 'api-key', 'ssh-record', 'password', 'memo']);
exports.CreateKnowledgeEntrySchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    type: exports.KnowledgeTypeSchema,
    content: zod_1.z.string().max(10000),
    requireEncryption: zod_1.z.boolean().optional(),
    tags: zod_1.z.array(zod_1.z.string().max(30)).max(20).optional(),
    category: zod_1.z.string().max(50).optional(),
});
exports.UpdateKnowledgeEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1).max(200).optional(),
    content: zod_1.z.string().max(10000).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(30)).max(20).optional(),
    category: zod_1.z.string().max(50).optional(),
});
exports.SearchKnowledgeSchema = zod_1.z.object({
    query: zod_1.z.string(),
    type: exports.KnowledgeTypeSchema.optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=knowledgeBase.js.map