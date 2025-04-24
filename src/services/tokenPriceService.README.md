# Token Price API

This API provides endpoints to fetch token prices from the AO oracle.

## API Endpoints

### Get Arweave Price (Original Method)

```
GET /api/token-price/arweave
```

This endpoint uses the `Get-Oracle-Price` action to fetch the price of WRAPPED_ARWEAVE tokens.

#### Response

```json
{
  "token": "WRAPPED_ARWEAVE",
  "id": "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
  "price": "6.32013233",
  "currency": "USD",
  "timestamp": "2023-11-15T12:34:56.789Z"
}
```

### Get Updated Token Price

```
GET /api/token-price/updated
```

This endpoint uses the `Get-Price-For-Token` action to fetch the most up-to-date price of WRAPPED_ARWEAVE tokens.

#### Response

```json
{
  "token": "WRAPPED_ARWEAVE",
  "id": "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
  "price": "6.3313400739758",
  "currency": "USD",
  "timestamp": "2023-11-15T12:34:56.789Z"
}
```

## Implementation Details

The API uses the `axios` library to make HTTP requests to the AO oracle process. It sends a dryrun request to the oracle with specific tags to fetch the token price.

### Original Method

The original method uses the `Get-Oracle-Price` action with the following tags:
```javascript
Tags: [
  { name: "Action", value: "Get-Oracle-Price" },
  { name: "Process-Id", value: tokenId },
  { name: "Data-Protocol", value: "ao" },
  { name: "Type", value: "Message" },
  { name: "Variant", value: "ao.TN.1" }
]
```

### Updated Method

The updated method uses the `Get-Price-For-Token` action with the following tags:
```javascript
Tags: [
  { name: "Action", value: "Get-Price-For-Token" },
  { name: "Quote-Token-Process", value: "USD" },
  { name: "Base-Token-Process", value: tokenId },
  { name: "Data-Protocol", value: "ao" },
  { name: "Type", value: "Message" },
  { name: "Variant", value: "ao.TN.1" }
]
```

The updated method also includes a fallback to the original method if the first attempt fails.

## Testing

You can test the token price services by running:

```bash
npx ts-node src/test-token-price.ts
```

This will fetch the token prices using both methods and display the results.
