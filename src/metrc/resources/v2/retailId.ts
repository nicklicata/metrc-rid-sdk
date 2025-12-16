// src/metrc/resources/v2/retailId.ts

import { MetrcHttp } from "../../http";
import { parseRetailId } from "../../../retailid/retailid-core";

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

export function createRetailIdV2(http: MetrcHttp) {
  return {
    // POST /retailid/v2/generate 
    generate(licenseNumber: string, req: RetailIdGenerateRequest) {
      return http.request<RetailIdGenerateResponse>({
        method: "POST",
        path: "/retailid/v2/generate",
        licenseNumber,
        body: req,
      });
    },

    // POST /retailid/v2/associate 
    associate(licenseNumber: string, items: RetailIdAssociateItem[]) {
      return http.request<RetailIdAssociateResponse>({
        method: "POST",
        path: "/retailid/v2/associate",
        licenseNumber,
        body: items,
      });
    },

    // POST /retailid/v2/merge 
    merge(licenseNumber: string, req: { packageLabels: string[] }) {
      return http.request<void>({
        method: "POST",
        path: "/retailid/v2/merge",
        licenseNumber,
        body: req,
      });
    },

    // POST /retailid/v2/packages/info 
    packagesInfo(licenseNumber: string, req: RetailIdPackagesInfoRequest) {
      return http.request<RetailIdPackagesInfoResponse>({
        method: "POST",
        path: "/retailid/v2/packages/info",
        licenseNumber,
        body: req,
      });
    },

    // GET /retailid/v2/receive/{label} 
    receiveByLabel(label: string, opts?: { licenseNumber?: string }) {
      return http.request<RetailIdReceiveResponse>({
        method: "GET",
        path: `/retailid/v2/receive/${encodeURIComponent(label)}`,
        licenseNumber: opts?.licenseNumber,
      });
    },

    // GET /retailid/v2/receive/qr/{shortCode} 
    receiveByShortCode(shortCode: string, licenseNumber: string) {
      return http.request<RetailIdReceiveResponse>({
        method: "GET",
        path: `/retailid/v2/receive/qr/${encodeURIComponent(shortCode)}`,
        licenseNumber,
      });
    },

    // Convenience: take scanned QR URL, parse shortCode, call receive/qr/...
    receiveByQrUrl(qrUrl: string, licenseNumber: string) {
      const parsed = parseRetailId(qrUrl);
      return this.receiveByShortCode(parsed.shortCode, licenseNumber);
    },
  };
}
