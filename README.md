# Korean Law Research API (Vercel + Next.js)

Production-oriented API scaffold for Korean legal research using Next.js App Router route handlers and Node.js runtime.

## Architecture

- **Client**: GPT/Gemini/internal service clients call REST endpoints.
- **Vercel API layer**: `/app/api/**/route.ts` route handlers.
- **Domain core**: abbreviation resolution, article normalization, delegation parsing, cross-analysis ranking.
- **Connectors**: Korean Law Open API XML connector (`lib/connectors/law-api.ts`).
- **Caching**: memory TTL cache (optional Redis placeholder).

## Folder Structure

- `app/api/search/*`
- `app/api/retrieve/*`
- `app/api/analyze/*`
- `app/api/chain/*`
- `lib/connectors`
- `lib/domain-core`
- `lib/chain`
- `lib/cache`
- `lib/schemas`
- `lib/xml`
- `lib/utils`
- `data/abbreviations.json`

## Environment

```bash
LAW_OC=your_api_key
LAW_API_BASE_URL=https://www.law.go.kr/DRF
LAW_API_MOCK=false
```

> `LAW_OC` is only used server-side in Node.js route handlers.
> `LAW_API_MOCK=true` enables deterministic mock responses for local/offline validation.

## Endpoints

### Search
- `GET /api/search/law?query=근기법`
- `GET /api/search/precedents?query=산업안전`
- `GET /api/search/rules?query=화학물질`
- `GET /api/search/ordinances?query=서울시`
- `GET /api/search/all?query=근기법&article=제38조`

### Retrieve
- `GET /api/retrieve/law-text?lawId=210746`
- `GET /api/retrieve/law-text?mst=192837&lawName=근로기준법` (fallback)
- `GET /api/retrieve/batch-articles?lawId=210746&articles=제38조,제39조의2`
- `GET /api/retrieve/compare-old-new?oldLawId=1001&newLawId=1002`
- `GET /api/retrieve/three-tier?query=산업안전`

### Analyze
- `GET /api/analyze/cross-reference?query=근로시간`
- `GET /api/analyze/delegation-map?lawName=근로기준법`
- `GET /api/analyze/related-norms?query=중대재해`
- `GET /api/analyze/conflict-candidates?query=안전보건`
- `GET /api/analyze/timeline-trace?query=근로기준법`

### Chain (8)
- `/api/chain/full-research`
- `/api/chain/law-system`
- `/api/chain/statute-to-precedent`
- `/api/chain/delegation-impact`
- `/api/chain/related-norms`
- `/api/chain/conflict-scan`
- `/api/chain/timeline-trace`
- `/api/chain/comparison`

## Standard Success Response

```json
{
  "success": true,
  "query": "근기법",
  "normalizedQuery": {},
  "results": {
    "laws": [],
    "articles": [],
    "precedents": [],
    "rules": [],
    "ordinances": []
  },
  "meta": {
    "durationMs": 23,
    "cacheHit": false,
    "sources": ["law.go.kr"]
  }
}
```

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "MISSING_QUERY",
    "message": "Missing query parameter: query"
  }
}
```

## Sample Requests / Expected Shape

1. `GET /api/search/law?query=근기법`
   - abbreviation engine resolves to `근로기준법`
   - returns `results.laws[]` with `lawId` / `mst` fields populated when available.

2. `GET /api/retrieve/law-text?lawId=210746`
   - performs identifier-based retrieval (`ID`/`MST` first strategy).
   - returns `results.articles[]`.

3. `GET /api/analyze/delegation-map?lawId=210746`
   - retrieves statute text by identifier.
   - returns delegation graph in `normalizedQuery.delegationGraph`.

4. `GET /api/chain/full-research?query=근기법&article=제38조`
   - resolve abbreviation → search → top statute identifier capture → article retrieval.
   - returns merged result buckets and chain metadata.

## Run Locally

```bash
npm install
npm run dev
```

## Real API Smoke Test (LAW_OC required)

```bash
LAW_OC=your_real_key LAW_API_MOCK=false npm run smoke:real
```

This runs 3 endpoint checks:
1. `GET /api/search/law?query=근로기준법`
2. `GET /api/retrieve/law-text?lawId=...&jo=제38조` (or `mst=...`)
3. `GET /api/chain/full-research?query=근로기준법 제38조`

Latest recorded real-API run: `docs/real-api-smoke-report.md`.

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import project in Vercel.
3. Set env vars:
   - `LAW_OC=...` (required in production)
   - `LAW_API_MOCK=false` (recommended production default)
   - `LAW_API_BASE_URL=https://www.law.go.kr/DRF`
4. Deploy.

### Production Deployment

- All routes run on Node.js runtime (`export const runtime = 'nodejs'`).
- If `LAW_API_MOCK !== true` and `LAW_OC` is missing in production, startup throws:
  - `"LAW_OC is required in production"`
- Health check endpoint:
  - `GET /api/health`
  - returns `status` and environment readiness (`mock`, `lawApiConfigured`).

### Smoke Test

```bash
bash scripts/smoke-prod.sh https://your-domain.vercel.app
```
