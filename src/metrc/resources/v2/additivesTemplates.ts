// src/metrc/resources/v2/additivesTemplates.ts

import { MetrcHttp } from "../../http";

// Types are based on Metrc example response structure. 
export interface AdditiveTemplate {
  Id: number;
  FacilityId: number;
  Name: string | null;
  AdditiveType: string;
  AdditiveTypeName: string | null;
  ApplicationDevice: string | null;
  EpaRegistrationNumber: string | null;
  Note: string | null;
  ProductSupplier: string | null;
  ProductTradeName: string | null;
  RestrictiveEntryIntervalQuantityDescription: string | null;
  RestrictiveEntryIntervalTimeDescription: string | null;
  ActiveIngredients: Array<{
    Name: string | null;
    Percentage: number | null;
  }>;
  // ...Metrc includes more fields in some states; keep it permissive.
  [k: string]: unknown;
}

export interface IdsResponse {
  Ids: number[];
  Warnings: unknown | null;
}

export function createAdditivesTemplatesV2(http: MetrcHttp) {
  return {
    /**
     * GET /additivestemplates/v2/{id}
     * Optional licenseNumber: validates against that facility; may return 401 if invalid. 
     */
    getById(id: number, opts?: { licenseNumber?: string }) {
      return http.request<AdditiveTemplate[]>({
        method: "GET",
        path: `/additivestemplates/v2/${encodeURIComponent(String(id))}`,
        licenseNumber: opts?.licenseNumber,
      });
    },

    /**
     * GET /additivestemplates/v2/active
     * Requires licenseNumber; supports pagination params. 
     */
    getActive(params: {
      licenseNumber: string;
      pageNumber?: number;
      pageSize?: number;
      lastModifiedStart?: string;
      lastModifiedEnd?: string;
    }) {
      return http.request<AdditiveTemplate[]>({
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
    getInactive(params: {
      licenseNumber: string;
      pageNumber?: number;
      pageSize?: number;
      lastModifiedStart?: string;
      lastModifiedEnd?: string;
    }) {
      return http.request<AdditiveTemplate[]>({
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
    create(licenseNumber: string, templates: Partial<AdditiveTemplate>[]) {
      return http.request<IdsResponse>({
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
    update(licenseNumber: string, templates: Partial<AdditiveTemplate>[]) {
      return http.request<IdsResponse>({
        method: "PUT",
        path: `/additivestemplates/v2/`,
        licenseNumber,
        body: templates,
      });
    },
  };
}
