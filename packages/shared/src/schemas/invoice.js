"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRevenueReportSchema = exports.UpdateInvoiceStatusSchema = exports.GenerateInvoiceSchema = exports.InvoiceStatusSchema = void 0;
const zod_1 = require("zod");
exports.InvoiceStatusSchema = zod_1.z.enum(['draft', 'sent', 'paid']);
exports.GenerateInvoiceSchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    sessionIds: zod_1.z.array(zod_1.z.string()).min(1),
    notes: zod_1.z.string().optional(),
});
exports.UpdateInvoiceStatusSchema = zod_1.z.object({
    id: zod_1.z.string(),
    status: exports.InvoiceStatusSchema,
    paidDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    paymentNotes: zod_1.z.string().optional(),
});
exports.GetRevenueReportSchema = zod_1.z.object({
    dateRange: zod_1.z.object({
        start: zod_1.z.string().or(zod_1.z.date()),
        end: zod_1.z.string().or(zod_1.z.date()),
    }),
    clientId: zod_1.z.string().optional(),
    sessionType: zod_1.z.enum(['education', 'technical']).optional(),
});
//# sourceMappingURL=invoice.js.map