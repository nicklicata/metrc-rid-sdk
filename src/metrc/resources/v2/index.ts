// AUTO-GENERATED. Do not edit.
import { MetrcHttp } from "../../http";
import { createLabTestsV2 } from "./labTests";

export function createAllV2Resources(http: MetrcHttp) {
  return {
    labTests: createLabTestsV2(http),
  } as const;
}
