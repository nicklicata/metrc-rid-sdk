import { MetrcHttp } from "../../http";
export interface RetailIdGenerateRequest {
    PackageLabel: string;
    Quantity: number;
}
export interface RetailIdGenerateResponse {
    IssuanceId: string;
}
export interface RetailIdAssociateItem {
    PackageLabel: string;
    QrUrls: string[];
}
export interface RetailIdAssociateResponse {
    Ids: number[];
    Warnings: unknown | null;
}
export interface RetailIdPackagesInfoRequest {
    packageLabels: string[];
}
export interface RetailIdPackagesInfoResponse {
    Packages: unknown[];
}
export interface RetailIdReceiveResponse {
    Eaches: string[];
    SiblingTags: string[];
    RequiresVerification: boolean;
    Ranges: Array<[number, number]>;
    QrCount: number;
    ChildTag: string | null;
    LabelSource: string;
}
export declare function createRetailIdV2(http: MetrcHttp): {
    generate(licenseNumber: string, req: RetailIdGenerateRequest): Promise<RetailIdGenerateResponse>;
    associate(licenseNumber: string, items: RetailIdAssociateItem[]): Promise<RetailIdAssociateResponse>;
    merge(licenseNumber: string, req: {
        packageLabels: string[];
    }): Promise<void>;
    packagesInfo(licenseNumber: string, req: RetailIdPackagesInfoRequest): Promise<RetailIdPackagesInfoResponse>;
    receiveByLabel(label: string, opts?: {
        licenseNumber?: string;
    }): Promise<RetailIdReceiveResponse>;
    receiveByShortCode(shortCode: string, licenseNumber: string): Promise<RetailIdReceiveResponse>;
    receiveByQrUrl(qrUrl: string, licenseNumber: string): Promise<RetailIdReceiveResponse>;
};
//# sourceMappingURL=retailId.d.ts.map