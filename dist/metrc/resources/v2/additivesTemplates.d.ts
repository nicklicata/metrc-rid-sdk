import { MetrcHttp } from "../../http";
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
    [k: string]: unknown;
}
export interface IdsResponse {
    Ids: number[];
    Warnings: unknown | null;
}
export declare function createAdditivesTemplatesV2(http: MetrcHttp): {
    /**
     * GET /additivestemplates/v2/{id}
     * Optional licenseNumber: validates against that facility; may return 401 if invalid.
     */
    getById(id: number, opts?: {
        licenseNumber?: string;
    }): Promise<AdditiveTemplate[]>;
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
    }): Promise<AdditiveTemplate[]>;
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
    }): Promise<AdditiveTemplate[]>;
    /**
     * POST /additivestemplates/v2/
     * Creates new templates. Returns Ids + Warnings.
     */
    create(licenseNumber: string, templates: Partial<AdditiveTemplate>[]): Promise<IdsResponse>;
    /**
     * PUT /additivestemplates/v2/
     * Updates existing templates.
     */
    update(licenseNumber: string, templates: Partial<AdditiveTemplate>[]): Promise<IdsResponse>;
};
//# sourceMappingURL=additivesTemplates.d.ts.map