#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${LAW_OC:-}" ]]; then
  echo "[SKIP] LAW_OC is not set. Real API smoke tests require a valid credential." >&2
  exit 0
fi

export LAW_API_MOCK=false

npm run dev >/tmp/kls-real-smoke.log 2>&1 &
DEV_PID=$!
trap 'kill ${DEV_PID} >/dev/null 2>&1 || true' EXIT

sleep 6

echo "[SMOKE] 1) /api/search/law?query=근로기준법"
code1=$(curl -s -o /tmp/kls-smoke-1.json -w "%{http_code}" "http://127.0.0.1:3000/api/search/law?query=%EA%B7%BC%EB%A1%9C%EA%B8%B0%EC%A4%80%EB%B2%95")
cat /tmp/kls-smoke-1.json
[[ "$code1" == "200" ]] || (echo "search/law failed: $code1" && exit 1)

law_id=$(python - <<'PY'
import json
obj=json.load(open('/tmp/kls-smoke-1.json'))
laws=obj.get('results',{}).get('laws',[])
print((laws[0].get('lawId') if laws else '') or '')
PY
)
mst=$(python - <<'PY'
import json
obj=json.load(open('/tmp/kls-smoke-1.json'))
laws=obj.get('results',{}).get('laws',[])
print((laws[0].get('mst') if laws else '') or '')
PY
)

if [[ -z "$law_id" && -z "$mst" ]]; then
  echo "No lawId/mst extracted from search result" >&2
  exit 1
fi

query2=""
if [[ -n "$law_id" ]]; then
  query2="lawId=${law_id}&jo=%EC%A0%9C38%EC%A1%B0"
else
  query2="mst=${mst}&jo=%EC%A0%9C38%EC%A1%B0"
fi

echo "[SMOKE] 2) /api/retrieve/law-text?${query2}"
code2=$(curl -s -o /tmp/kls-smoke-2.json -w "%{http_code}" "http://127.0.0.1:3000/api/retrieve/law-text?${query2}")
cat /tmp/kls-smoke-2.json
[[ "$code2" == "200" ]] || (echo "retrieve/law-text failed: $code2" && exit 1)

echo "[SMOKE] 3) /api/chain/full-research?query=근로기준법 제38조"
code3=$(curl -s -o /tmp/kls-smoke-3.json -w "%{http_code}" "http://127.0.0.1:3000/api/chain/full-research?query=%EA%B7%BC%EB%A1%9C%EA%B8%B0%EC%A4%80%EB%B2%95%20%EC%A0%9C38%EC%A1%B0")
cat /tmp/kls-smoke-3.json
[[ "$code3" == "200" ]] || (echo "chain/full-research failed: $code3" && exit 1)

echo "[PASS] Real API smoke tests completed successfully"
