"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabTestsV2 = createLabTestsV2;
function createLabTestsV2(http) {
    return {
        /**
         * GET /labtests/v2/states
         * Returns a list of all lab testing states. No params. :contentReference[oaicite:9]{index=9}
         */
        getStates() {
            return http.request({
                method: "GET",
                path: "/labtests/v2/states",
            });
        },
        /**
         * GET /labtests/v2/batches
         * Retrieves a list of Lab Test batches. Optional paging. :contentReference[oaicite:10]{index=10}
         */
        getBatches(query) {
            return http.request({
                method: "GET",
                path: "/labtests/v2/batches",
                query,
            });
        },
        /**
         * GET /labtests/v2/types
         * Returns a list of Lab Test types. Optional paging. :contentReference[oaicite:11]{index=11}
         */
        getTypes(query) {
            return http.request({
                method: "GET",
                path: "/labtests/v2/types",
                query,
            });
        },
        /**
         * GET /labtests/v2/results
         * Retrieves Lab Test results for a specified Package. Requires packageId + licenseNumber. :contentReference[oaicite:12]{index=12}
         */
        getResults(query) {
            return http.request({
                method: "GET",
                path: "/labtests/v2/results",
                query,
            });
        },
        /**
         * POST /labtests/v2/record
         * Submits Lab Test results for one or more packages.
         * Docs note: PDF only, max 5MB; "Label" is a Package Label. :contentReference[oaicite:13]{index=13}
         */
        record(licenseNumber, body) {
            return http.request({
                method: "POST",
                path: "/labtests/v2/record",
                query: { licenseNumber },
                body,
            });
        },
        /**
         * PUT /labtests/v2/labtestdocument
         * Updates one or more documents for previously submitted lab tests. Requires licenseNumber. :contentReference[oaicite:14]{index=14}
         */
        updateLabTestDocument(licenseNumber, body) {
            return http.request({
                method: "PUT",
                path: "/labtests/v2/labtestdocument",
                query: { licenseNumber },
                body,
            });
        },
        /**
         * PUT /labtests/v2/results/release
         * Releases Lab Test results for one or more packages. Requires licenseNumber. :contentReference[oaicite:15]{index=15}
         */
        releaseResults(licenseNumber, body) {
            return http.request({
                method: "PUT",
                path: "/labtests/v2/results/release",
                query: { licenseNumber },
                body,
            });
        },
        /**
         * GET /labtests/v2/labtestdocument/{id}
         * Retrieves a specific Lab Test result document by its Id for a given facility; requires licenseNumber. :contentReference[oaicite:16]{index=16}
         *
         * Docs show "No response" (i.e., likely a file download / binary). :contentReference[oaicite:17]{index=17}
         * So we return `unknown` and let your MetrcHttp decide how to surface bytes (Buffer/ArrayBuffer/etc).
         */
        getLabTestDocumentById(licenseNumber, id) {
            return http.request({
                method: "GET",
                path: `/labtests/v2/labtestdocument/${encodeURIComponent(String(id))}`,
                query: { licenseNumber },
            });
        },
    };
}
//# sourceMappingURL=labTests.js.map