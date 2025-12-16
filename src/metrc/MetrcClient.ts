import { MetrcHttp, MetrcHttpOptions } from "./http";

import { createRetailIdV2 } from "./resources/v2/retailId"; // hand-written subset
import { createAllV2Resources } from "./resources/v2";      // generated index
import { createAllV1Resources } from "./resources/v1";      // generated index

export class MetrcClient {
  public readonly http: MetrcHttp;

  public readonly v1: ReturnType<typeof createAllV1Resources>;
  public readonly v2: ReturnType<typeof createAllV2Resources> & {
    retailId: ReturnType<typeof createRetailIdV2>;
  };

  constructor(opts: MetrcHttpOptions) {
    this.http = new MetrcHttp(opts);

    // auto-attach everything that exists today (generated)
    this.v1 = createAllV1Resources(this.http);

    // v2: attach generated + your hand-written RetailId subset
    this.v2 = {
      ...createAllV2Resources(this.http),
      retailId: createRetailIdV2(this.http),
    };
  }
}
