import { MetrcHttp, MetrcHttpOptions } from "./http";
import { createRetailIdV2 } from "./resources/v2/retailId";
import { createAllV2Resources } from "./resources/v2";
import { createAllV1Resources } from "./resources/v1";
export declare class MetrcClient {
    readonly http: MetrcHttp;
    readonly v1: ReturnType<typeof createAllV1Resources>;
    readonly v2: ReturnType<typeof createAllV2Resources> & {
        retailId: ReturnType<typeof createRetailIdV2>;
    };
    constructor(opts: MetrcHttpOptions);
}
//# sourceMappingURL=MetrcClient.d.ts.map