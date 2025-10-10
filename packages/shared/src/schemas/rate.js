"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRateSchema = exports.CreateRateSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("./client");
exports.CreateRateSchema = zod_1.z.object({
    clientId: zod_1.z.string().optional(),
    clientType: client_1.ClientTypeSchema.optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('CNY'),
    effectiveDate: zod_1.z.string().or(zod_1.z.date()),
    endDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    description: zod_1.z.string().max(200).optional(),
}).refine((data) => data.clientId || data.clientType, { message: 'Either clientId or clientType must be provided' });
exports.UpdateRateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    amount: zod_1.z.number().positive().optional(),
    endDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    description: zod_1.z.string().max(200).optional(),
});
//# sourceMappingURL=rate.js.map