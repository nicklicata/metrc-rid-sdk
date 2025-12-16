"use strict";
// src/metrc/resources/v2/additivesTemplates.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdditivesTemplatesV2 = createAdditivesTemplatesV2;
function createAdditivesTemplatesV2(http) {
    return {
        /**
         * GET /additivestemplates/v2/{id}
         * Optional licenseNumber: validates against that facility; may return 401 if invalid.
         */
        getById(id, opts) {
            return http.request({
                method: "GET",
                path: `/additivestemplates/v2/${encodeURIComponent(String(id))}`,
                licenseNumber: opts?.licenseNumber,
            });
        },
        /**
         * GET /additivestemplates/v2/active
         * Requires licenseNumber; supports pagination params.
         */
        getActive(params) {
            return http.request({
                method: "GET",
                path: `/additivestemplates/v2/active`,
                licenseNumber: params.licenseNumber,
                query: {
                    pageNumber: params.pageNumber,
                    pageSize: params.pageSize,
                    lastModifiedStart: params.lastModifiedStart,
                    lastModifiedEnd: params.lastModifiedEnd,
                },
            });
        },
        /**
         * GET /additivestemplates/v2/inactive
         * (Same shape as active)
         */
        getInactive(params) {
            return http.request({
                method: "GET",
                path: `/additivestemplates/v2/inactive`,
                licenseNumber: params.licenseNumber,
                query: {
                    pageNumber: params.pageNumber,
                    pageSize: params.pageSize,
                    lastModifiedStart: params.lastModifiedStart,
                    lastModifiedEnd: params.lastModifiedEnd,
                },
            });
        },
        /**
         * POST /additivestemplates/v2/
         * Creates new templates. Returns Ids + Warnings.
         */
        create(licenseNumber, templates) {
            return http.request({
                method: "POST",
                path: `/additivestemplates/v2/`,
                licenseNumber,
                body: templates,
            });
        },
        /**
         * PUT /additivestemplates/v2/
         * Updates existing templates.
         */
        update(licenseNumber, templates) {
            return http.request({
                method: "PUT",
                path: `/additivestemplates/v2/`,
                licenseNumber,
                body: templates,
            });
        },
    };
}
//# sourceMappingURL=additivesTemplates.js.map