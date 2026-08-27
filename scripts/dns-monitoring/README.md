# Validating DNS monitor

`doh-probe.sh` checks whether public recursive resolvers can resolve the
production hostnames with DNSSEC validation enabled. It is intended for a
scheduled synthetic monitor or a DNS-change verification run.

The probe queries two independently operated DNS-over-HTTPS (DoH) resolvers:

- Cloudflare: `https://cloudflare-dns.com/dns-query`
- Google: `https://dns.google/resolve`

It runs from the network where it is invoked. Use the same probe from more than
one external monitoring location; using two resolver operators does not make a
single monitor location independent.

## Requirements

- POSIX `sh`
- `curl`
- `jq`
- Outbound HTTPS access to the two DoH endpoints

Run it through `sh`; the file does not need to be executable:

```sh
sh scripts/dns-monitoring/doh-probe.sh
```

For command-level debugging:

```sh
sh -x scripts/dns-monitoring/doh-probe.sh
```

The script writes a result for every hostname and resolver to standard output.
If a monitoring service displays no output for a non-zero command, inspect that
service's captured job log or run the command above directly.

## What is checked

The host lists are maintained near the top of `doh-probe.sh`.

### Strict hosts

`STRICT_HOSTS` (the apex and `catch`) are plain `A` records directly in the
signed `onetimesecret.com` zone. A passing response must have all of the
following:

- DNS response status `NOERROR` (`Status=0`)
- at least one `A` answer
- checking-disabled (`CD=false`)
- authenticated data (`AD=true`)

`AD=true` indicates that the selected resolver validated the DNSSEC chain. A
`SERVFAIL` response, a missing `AD` flag, or no address answer fails the check.

### Reachable hosts

`REACHABLE_HOSTS` are the regional endpoints (`eu`, `ca`, `uk`, `nz`, `us`),
which are fronted by Bunny Shield, and `www`, which CNAMEs into Bunny CDN's
unsigned `b-cdn.net` zone. Because the resolution chain may include records the
resolver cannot validate, the complete answer is allowed to have `AD=false`. A
passing response must still have `Status=0`, `CD=false`, and an `A` answer.

This exemption does **not** hide a DNSSEC break in the signed portion of the
chain. A resolver that cannot validate that signed CNAME should return
`SERVFAIL`, which fails this check.

## Output and exit status

A healthy result resembles:

```text
onetimesecret.com [strict]
  dns-query                Status=0 AD=true  answers=1
  resolve                  Status=0 AD=true  answers=1

OK: all DNSSEC checks passed
```

The script exits:

- `0` when every assertion passes;
- `1` when one or more checks fail.

A non-zero exit is expected when a resolver reports a DNSSEC error. For example,
the following is an actionable failure even though the hostname is in the
`reachable` group:

```text
www.onetimesecret.com [reachable]
  dns-query                Status=2 AD=false answers=0
    -> FAIL (assertion not met)
ALERT: 1 check(s) failed
```

`Status=2` is DNS `SERVFAIL`. Cloudflare's response for the incident case also
included `EDE(9): DNSKEY Missing`, which indicates DNSSEC validation failed.
The script labels this an assertion failure rather than a network failure
because the DoH request itself succeeded.

A missing `curl` or `jq`, an unreadable script, or a shell startup error can
produce a different operating-system exit code before the script prints its own
summary.

## Operational use

1. Run this probe every 1–5 minutes from at least two external locations.
2. Alert on any sustained failure and include the hostname, resolver, `Status`,
   `AD`, and answer count in the alert.
3. During a DNSSEC, DS, or nameserver change, run it before the change and keep
   it running for at least the maximum relevant DNSKEY, DS, and NS TTL.
4. Do not declare the change complete until independent validating resolvers
   consistently return successful results.

This probe tests recursive resolution only. It should be paired with a separate
delegation and authoritative-consistency check that verifies the `.com` NS and
DS records, the DNSKEY set served by every delegated authoritative nameserver,
and the intended critical records.

## Updating the hostname groups

Add a hostname to `STRICT_HOSTS` only when its complete `A` resolution remains
within a DNSSEC-signed chain. Add it to `REACHABLE_HOSTS` when its signed record
chains into an unsigned provider-controlled zone. Review both lists whenever a
new regional endpoint, CDN, or load balancer is introduced.
