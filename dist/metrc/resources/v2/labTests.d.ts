import { MetrcHttp } from "../../http";
/**
 * Lab Tests (v2)
 *
 * Endpoints implemented (manual/demo subset):
 * - GET /labtests/v2/states
 * - GET /labtests/v2/batches
 * - GET /labtests/v2/types
 * - GET /labtests/v2/results
 * - POST /labtests/v2/record
 * - PUT /labtests/v2/labtestdocument
 * - PUT /labtests/v2/results/release
 * - GET /labtests/v2/labtestdocument/{id}
 *
 * Notes straight from docs:
 * - POST /labtests/v2/record: PDF only, max 5MB; "Label" is the Package Label. :contentReference[oaicite:1]{index=1}
 * - GET /labtests/v2/results requires packageId + licenseNumber. :contentReference[oaicite:2]{index=2}
 * - GET /labtests/v2/states has no parameters. :contentReference[oaicite:3]{index=3}
 * - GET /labtests/v2/batches, /types support optional paging pageNumber/pageSize (<=20 to enable). :contentReference[oaicite:4]{index=4}
 * - GET /labtests/v2/labtestdocument/{id} returns "No response" in docs (this is typically a file download). :contentReference[oaicite:5]{index=5}
 */
export type MetrcLicenseNumber = string;
export interface Paging {
    pageNumber?: number;
    pageSize?: number;
}
export interface LabTestRecordResult {
    LabTestTypeName: string;
    Quantity?: number;
    Passed?: boolean;
    Notes?: string;
}
export interface LabTestRecordEntry {
    /** Package label */
    Label: string;
    ResultDate: string;
    /** PDF filename */
    DocumentFileName: string;
    /** Base64 encoded PDF (<= 5MB, PDF only per docs) :contentReference[oaicite:8]{index=8} */
    DocumentFileBase64: string;
    Results: LabTestRecordResult[];
}
export interface LabTestDocumentUpdateEntry {
    LabTestResultId: number;
    DocumentFileName: string;
    DocumentFileBase64: string;
}
export interface LabTestReleaseEntry {
    PackageLabel: string;
}
export interface LabTestsResultsQuery extends Paging {
    licenseNumber: MetrcLicenseNumber;
    packageId: number;
}
export declare function createLabTestsV2(http: MetrcHttp): {
    /**
     * GET /labtests/v2/states
     * Returns a list of all lab testing states. No params. :contentReference[oaicite:9]{index=9}
     */
    readonly getStates: () => Promise<string[]>;
    /**
     * GET /labtests/v2/batches
     * Retrieves a list of Lab Test batches. Optional paging. :contentReference[oaicite:10]{index=10}
     */
    readonly getBatches: (query?: Paging) => Promise<unknown>;
    /**
     * GET /labtests/v2/types
     * Returns a list of Lab Test types. Optional paging. :contentReference[oaicite:11]{index=11}
     */
    readonly getTypes: (query?: Paging) => Promise<unknown>;
    /**
     * GET /labtests/v2/results
     * Retrieves Lab Test results for a specified Package. Requires packageId + licenseNumber. :contentReference[oaicite:12]{index=12}
     */
    readonly getResults: (query: LabTestsResultsQuery) => Promise<unknown>;
    /**
     * POST /labtests/v2/record
     * Submits Lab Test results for one or more packages.
     * Docs note: PDF only, max 5MB; "Label" is a Package Label. :contentReference[oaicite:13]{index=13}
     */
    readonly record: (licenseNumber: MetrcLicenseNumber, body: LabTestRecordEntry[]) => Promise<void>;
    /**
     * PUT /labtests/v2/labtestdocument
     * Updates one or more documents for previously submitted lab tests. Requires licenseNumber. :contentReference[oaicite:14]{index=14}
     */
    readonly updateLabTestDocument: (licenseNumber: MetrcLicenseNumber, body: LabTestDocumentUpdateEntry[]) => Promise<void>;
    /**
     * PUT /labtests/v2/results/release
     * Releases Lab Test results for one or more packages. Requires licenseNumber. :contentReference[oaicite:15]{index=15}
     */
    readonly releaseResults: (licenseNumber: MetrcLicenseNumber, body: LabTestReleaseEntry[]) => Promise<void>;
    /**
     * GET /labtests/v2/labtestdocument/{id}
     * Retrieves a specific Lab Test result document by its Id for a given facility; requires licenseNumber. :contentReference[oaicite:16]{index=16}
     *
     * Docs show "No response" (i.e., likely a file download / binary). :contentReference[oaicite:17]{index=17}
     * So we return `unknown` and let your MetrcHttp decide how to surface bytes (Buffer/ArrayBuffer/etc).
     */
    readonly getLabTestDocumentById: (licenseNumber: MetrcLicenseNumber, id: number) => Promise<unknown>;
};
//# sourceMappingURL=labTests.d.ts.map