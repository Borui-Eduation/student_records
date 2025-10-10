"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationInputSchema = void 0;
const zod_1 = require("zod");
exports.PaginationInputSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
    cursor: zod_1.z.string().optional(),
});
//# sourceMappingURL=common.js.map