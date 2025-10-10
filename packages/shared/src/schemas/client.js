"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListClientsSchema = exports.UpdateClientSchema = exports.CreateClientSchema = exports.ContactInfoSchema = exports.ClientTypeSchema = void 0;
const zod_1 = require("zod");
exports.ClientTypeSchema = zod_1.z.enum(['institution', 'individual', 'project']);
exports.ContactInfoSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(10).max(20).optional(),
    address: zod_1.z.string().max(500).optional(),
});
exports.CreateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).trim(),
    type: exports.ClientTypeSchema,
    contactInfo: exports.ContactInfoSchema.optional(),
    billingAddress: zod_1.z.string().max(500).optional(),
    taxId: zod_1.z.string().max(50).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.UpdateClientSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(200).trim().optional(),
    contactInfo: exports.ContactInfoSchema.optional(),
    billingAddress: zod_1.z.string().max(500).optional(),
    taxId: zod_1.z.string().max(50).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.ListClientsSchema = zod_1.z.object({
    type: exports.ClientTypeSchema.optional(),
    active: zod_1.z.boolean().optional().default(true),
    search: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
    cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=client.js.map