# Real API Smoke Report (LAW_OC)

Date: 2026-04-03

Environment:
- `LAW_API_MOCK=false`
- `LAW_OC` configured (redacted)

Command:

```bash
LAW_OC=<redacted> LAW_API_MOCK=false npm run smoke:real
```

## Results

1. `GET /api/search/law?query=근로기준법`
   - status: `200`
   - result: `OK`
   - extracted `lawId`: `<redacted>`
   - extracted `mst`: `<redacted>`

2. `GET /api/retrieve/law-text`
   - input: `lawId=<redacted>, jo=제38조`
   - normalized `jo`: `003800`
   - status: `200`
   - result: `OK` (article content returned)

3. `GET /api/chain/full-research?query=근로기준법 제38조`
   - status: `200`
   - result: `OK`
   - includes:
     - laws: yes
     - articles: yes
     - precedents: yes
     - delegation tree: yes

## Conclusion

All three real API paths returned `200` successfully with `LAW_OC` configured.
