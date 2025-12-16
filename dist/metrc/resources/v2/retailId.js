"use strict";
// src/metrc/resources/v2/retailId.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetailIdV2 = createRetailIdV2;
const retailid_core_1 = require("../../../retailid/retailid-core");
function createRetailIdV2(http) {
    return {
        // POST /retailid/v2/generate 
        generate(licenseNumber, req) {
            return http.request({
                method: "POST",
                path: "/retailid/v2/generate",
                licenseNumber,
                body: req,
            });
        },
        // POST /retailid/v2/associate 
        associate(licenseNumber, items) {
            return http.request({
                method: "POST",
                path: "/retailid/v2/associate",
                licenseNumber,
                body: items,
            });
        },
        // POST /retailid/v2/merge 
        merge(licenseNumber, req) {
            return http.request({
                method: "POST",
                path: "/retailid/v2/merge",
                licenseNumber,
                body: req,
            });
        },
        // POST /retailid/v2/packages/info 
        packagesInfo(licenseNumber, req) {
            return http.request({
                method: "POST",
                path: "/retailid/v2/packages/info",
                licenseNumber,
                body: req,
            });
        },
        // GET /retailid/v2/receive/{label} 
        receiveByLabel(label, opts) {
            return http.request({
                method: "GET",
                path: `/retailid/v2/receive/${encodeURIComponent(label)}`,
                licenseNumber: opts?.licenseNumber,
            });
        },
        // GET /retailid/v2/receive/qr/{shortCode} 
        receiveByShortCode(shortCode, licenseNumber) {
            return http.request({
                method: "GET",
                path: `/retailid/v2/receive/qr/${encodeURIComponent(shortCode)}`,
                licenseNumber,
            });
        },
        // Convenience: take scanned QR URL, parse shortCode, call receive/qr/...
        receiveByQrUrl(qrUrl, licenseNumber) {
            const parsed = (0, retailid_core_1.parseRetailId)(qrUrl);
            return this.receiveByShortCode(parsed.shortCode, licenseNumber);
        },
    };
}
//# sourceMappingURL=retailId.js.map