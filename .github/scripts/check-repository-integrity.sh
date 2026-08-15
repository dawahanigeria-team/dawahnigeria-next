#!/usr/bin/env bash
set -euo pipefail

failed=0
payload_header='x-'"payload-"
rpc_method='eth_get'"TransactionCount"
global_marker='global\.i=.{0,8}A8-'
automatic_tasks='task\.allow'"AutomaticTasks"
folder_open='folder'"Open"
no_verify='--no-'"verify"
node_font='node .*\.woff2'

report() {
  printf 'repository-integrity: %s\n' "$*" >&2
  failed=1
}

matches=$(git grep -I -n -E "$payload_header|$rpc_method|$global_marker|$automatic_tasks|$folder_open|git push.*$no_verify|$node_font" -- . ':(exclude).github/scripts/check-repository-integrity.sh' || true)
if [[ -n "$matches" ]]; then
  printf '%s\n' "$matches" >&2
  report 'known malicious payload indicator found'
fi

while IFS= read -r config; do
  [[ -f "$config" ]] || continue
  if grep -Eq 'child_process|new[[:space:]]+Function|eval[[:space:]]*\(|spawn[[:space:]]*\(|exec[[:space:]]*\(' "$config"; then
    report "dynamic execution found in build config: $config"
  fi
  if awk 'length($0) > 8000 { found=1 } END { exit !found }' "$config"; then
    report "abnormally long line found in build config: $config"
  fi
done < <(git ls-files | grep -E '(^|/)(postcss|tailwind)\.config\.(js|cjs|mjs|ts)$' || true)

while IFS= read -r font; do
  [[ -f "$font" ]] || continue
  magic=$(od -An -tx1 -N4 "$font" | tr -d '[:space:]')
  case "$font" in
    *.woff2) [[ "$magic" == '774f4632' ]] || report "invalid WOFF2 file signature: $font" ;;
    *.woff)  [[ "$magic" == '774f4646' ]] || report "invalid WOFF file signature: $font" ;;
  esac
done < <(git ls-files '*.woff' '*.woff2')

exit "$failed"
