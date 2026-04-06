#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: bash scripts/smoke-prod.sh https://your-domain.vercel.app" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "[SMOKE] 1) ${BASE_URL}/api/search/law?query=근로기준법"
code1=$(curl -s -o /tmp/kls-prod-1.json -w "%{http_code}" "${BASE_URL}/api/search/law?query=%EA%B7%BC%EB%A1%9C%EA%B8%B0%EC%A4%80%EB%B2%95")
cat /tmp/kls-prod-1.json
[[ "$code1" == "200" ]] || (echo "search/law failed: $code1" && exit 1)

law_id=$(python - <<'PY'
import json
obj=json.load(open('/tmp/kls-prod-1.json'))
laws=obj.get('results',{}).get('laws',[])
print((laws[0].get('lawId') if laws else '') or '')
PY
)
mst=$(python - <<'PY'
import json
obj=json.load(open('/tmp/kls-prod-1.json'))
laws=obj.get('results',{}).get('laws',[])
print((laws[0].get('mst') if laws else '') or '')
PY
)

if [[ -z "$law_id" && -z "$mst" ]]; then
  echo "No lawId/mst extracted from search result" >&2
  exit 1
fi

if [[ -n "$law_id" ]]; then
  query2="lawId=${law_id}&jo=%EC%A0%9C38%EC%A1%B0"
else
  query2="mst=${mst}&jo=%EC%A0%9C38%EC%A1%B0"
fi

echo "[SMOKE] 2) ${BASE_URL}/api/retrieve/law-text?${query2}"
code2=$(curl -s -o /tmp/kls-prod-2.json -w "%{http_code}" "${BASE_URL}/api/retrieve/law-text?${query2}")
cat /tmp/kls-prod-2.json
[[ "$code2" == "200" ]] || (echo "retrieve/law-text failed: $code2" && exit 1)

echo "[SMOKE] 3) ${BASE_URL}/api/chain/full-research?query=근로기준법 제38조"
code3=$(curl -s -o /tmp/kls-prod-3.json -w "%{http_code}" "${BASE_URL}/api/chain/full-research?query=%EA%B7%BC%EB%A1%9C%EA%B8%B0%EC%A4%80%EB%B2%95%20%EC%A0%9C38%EC%A1%B0")
cat /tmp/kls-prod-3.json
[[ "$code3" == "200" ]] || (echo "chain/full-research failed: $code3" && exit 1)

echo "[PASS] Production smoke tests completed"
