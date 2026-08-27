#!/usr/bin/env sh
set -eu

# DNSSEC monitoring via DNS-over-HTTPS against two independent resolver operators.
# Exit 0 = all checks passed. Exit 1 = at least one host failed its assertion.
#
# Hosts are split by where their A record ultimately lives:
#   STRICT_HOSTS    - terminal A in the signed onetimesecret.com zone.
#                     Require full DNSSEC validation (Status=NOERROR, AD=true, CD=false, answer).
#                     A SERVFAIL or AD=false here is a real DNSSEC break -> alert.
#   REACHABLE_HOSTS - CNAME into an unsigned third-party zone (CDN / load balancer) by design.
#                     AD is legitimately false, so only require NOERROR + an answer.
#                     A genuine signature break still returns SERVFAIL and still fails here.
STRICT_HOSTS="onetimesecret.com eu.onetimesecret.com ca.onetimesecret.com nz.onetimesecret.com us.onetimesecret.com"
REACHABLE_HOSTS="www.onetimesecret.com uk.onetimesecret.com"

RESOLVERS="https://cloudflare-dns.com/dns-query https://dns.google/resolve"

failures=0

# check_dnssec RESOLVER HOST MODE
#   MODE=strict    -> Status=0, AD=true, CD=false, >=1 A answer
#   MODE=reachable -> Status=0, CD=false, >=1 A answer (AD informational)
# Returns: 0 pass, 1 assertion failed, 2 network/transport error.
check_dnssec() {
  resolver=$1
  host=$2
  mode=$3

  response=$(
    curl --fail --silent --show-error --max-time 10 \
      --get "$resolver" \
      --data-urlencode "name=$host" \
      --data-urlencode "type=A" \
      --data-urlencode "do=true" \
      -H "Accept: application/dns-json"
  ) || return 2

  status=$(echo "$response" | jq -r '.Status')
  ad=$(echo "$response" | jq -r '.AD')
  answers=$(echo "$response" | jq -r '[.Answer[]? | select(.type == 1)] | length')

  printf '  %-24s Status=%s AD=%-5s answers=%s\n' "$(basename "$resolver")" "$status" "$ad" "$answers"

  if [ "$mode" = strict ]; then
    echo "$response" | jq --exit-status '
      .Status == 0 and .AD == true and .CD == false and
      ([.Answer[]? | select(.type == 1)] | length > 0)
    ' >/dev/null
  else
    echo "$response" | jq --exit-status '
      .Status == 0 and .CD == false and
      ([.Answer[]? | select(.type == 1)] | length > 0)
    ' >/dev/null
  fi
}

run_group() {
  mode=$1
  shift
  for host in "$@"; do
    printf '%s [%s]\n' "$host" "$mode"
    for resolver in $RESOLVERS; do
      if check_dnssec "$resolver" "$host" "$mode"; then
        :
      else
        rc=$?
        if [ "$rc" -eq 2 ]; then
          echo "    -> QUERY FAILED (network/timeout)"
        else
          echo "    -> FAIL (assertion not met)"
        fi
        failures=$((failures + 1))
      fi
    done
  done
}

run_group strict $STRICT_HOSTS
run_group reachable $REACHABLE_HOSTS

echo
if [ "$failures" -eq 0 ]; then
  echo "OK: all DNSSEC checks passed"
  exit 0
fi
echo "ALERT: $failures check(s) failed"
exit 1
