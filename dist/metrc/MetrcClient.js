"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetrcClient = void 0;
const http_1 = require("./http");
const retailId_1 = require("./resources/v2/retailId"); // hand-written subset
const v2_1 = require("./resources/v2"); // generated index
const v1_1 = require("./resources/v1"); // generated index
class MetrcClient {
    constructor(opts) {
        this.http = new http_1.MetrcHttp(opts);
        // auto-attach everything that exists today (generated)
        this.v1 = (0, v1_1.createAllV1Resources)(this.http);
        // v2: attach generated + your hand-written RetailId subset
        this.v2 = {
            ...(0, v2_1.createAllV2Resources)(this.http),
            retailId: (0, retailId_1.createRetailIdV2)(this.http),
        };
    }
}
exports.MetrcClient = MetrcClient;
//# sourceMappingURL=MetrcClient.js.map