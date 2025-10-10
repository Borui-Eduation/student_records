"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSharingLinkSchema = void 0;
const zod_1 = require("zod");
exports.CreateSharingLinkSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    expiresInDays: zod_1.z.number().positive().optional().default(90),
});
//# sourceMappingURL=sharingLink.js.map