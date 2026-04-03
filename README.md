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
```

> `LAW_OC` is only used server-side in Node.js route handlers.

## Endpoints

### Search
- `GET /api/search/law?query=근기법`
- `GET /api/search/precedents?query=산업안전`
- `GET /api/search/rules?query=화학물질`
- `GET /api/search/ordinances?query=서울시`
- `GET /api/search/all?query=근기법&article=제38조`

### Retrieve
- `GET /api/retrieve/law-text?lawName=근로기준법`
- `GET /api/retrieve/batch-articles?lawName=근로기준법&articles=제38조,제39조의2`
- `GET /api/retrieve/compare-old-new?oldLawName=A&newLawName=B`
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

## Run Locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import project in Vercel.
3. Set env vars (`LAW_OC`, `LAW_API_BASE_URL`).
4. Deploy.

