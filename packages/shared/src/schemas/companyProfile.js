"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCompanyProfileSchema = exports.CompanyContactInfoSchema = exports.BankInfoSchema = void 0;
const zod_1 = require("zod");
exports.BankInfoSchema = zod_1.z.object({
    bankName: zod_1.z.string().min(1).max(100),
    accountNumber: zod_1.z.string().min(1).max(50),
    accountName: zod_1.z.string().min(1).max(100),
    swiftCode: zod_1.z.string().max(20).optional(),
});
exports.CompanyContactInfoSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10).max(20),
    website: zod_1.z.string().url().optional(),
});
exports.UpdateCompanyProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).max(200).optional(),
    taxId: zod_1.z.string().min(1).max(50).optional(),
    address: zod_1.z.string().min(1).max(500).optional(),
    bankInfo: exports.BankInfoSchema.optional(),
    contactInfo: exports.CompanyContactInfoSchema.optional(),
    logoUrl: zod_1.z.string().url().optional(),
});
//# sourceMappingURL=companyProfile.js.map