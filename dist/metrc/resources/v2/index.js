"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAllV2Resources = createAllV2Resources;
const labTests_1 = require("./labTests");
function createAllV2Resources(http) {
    return {
        labTests: (0, labTests_1.createLabTestsV2)(http),
    };
}
//# sourceMappingURL=index.js.map