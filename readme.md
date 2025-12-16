## Spin off of retail id sdk

### Original Retail ID functionality
```typescript
// Encode a batch ID and index to a short URL
const batchId = new ObjectId("1a4060300020081000006609");
const url = getShortUrl(batchId, 1);
// => "HTTPS://1A4.COM/5LN8CBN1UB33DON9CHKX"
console.log(url);
// Decode a short URL back to its components
const pair = new RetailIdPair("HTTPS://1A4.COM/5LN8CBN1UB33DON9CHKX");
console.log(pair.batchId.toHexString()); // "1a4060300020081000006609"
console.log(pair.index);                 // 1
// Re-encode (round-trip)
console.log(pair.encode());              // "HTTPS://1A4.COM/5LN8CBN1UB33DON9CHKX"
```

### Metrc API usage
```typescript
const metrc = new MetrcClient({
    baseUrl: "https://api-ca.metrc.com",
    integratorApiKey: process.env.METRC_INTEGRATOR_KEY!,
    userApiKey: process.env.METRC_USER_KEY!,
});
const states = await metrc.v2.labTests.getStates();
console.log(states);
const results = await metrc.v2.labTests.getResults({
    licenseNumber: "123-ABC",
    packageId: 1,
    pageNumber: 1,
    pageSize: 10,
});
console.log(results);
```