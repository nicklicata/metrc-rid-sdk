import { MetrcHttp } from "../../http";
export declare function createAllV2Resources(http: MetrcHttp): {
    readonly labTests: {
        readonly getStates: () => Promise<string[]>;
        readonly getBatches: (query?: import("./labTests").Paging) => Promise<unknown>;
        readonly getTypes: (query?: import("./labTests").Paging) => Promise<unknown>;
        readonly getResults: (query: import("./labTests").LabTestsResultsQuery) => Promise<unknown>;
        readonly record: (licenseNumber: import("./labTests").MetrcLicenseNumber, body: import("./labTests").LabTestRecordEntry[]) => Promise<void>;
        readonly updateLabTestDocument: (licenseNumber: import("./labTests").MetrcLicenseNumber, body: import("./labTests").LabTestDocumentUpdateEntry[]) => Promise<void>;
        readonly releaseResults: (licenseNumber: import("./labTests").MetrcLicenseNumber, body: import("./labTests").LabTestReleaseEntry[]) => Promise<void>;
        readonly getLabTestDocumentById: (licenseNumber: import("./labTests").MetrcLicenseNumber, id: number) => Promise<unknown>;
    };
};
//# sourceMappingURL=index.d.ts.map