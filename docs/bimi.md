# BIMI Setup Guide

BIMI (Brand Indicators for Message Identification) lets mailbox providers such as
Gmail, Yahoo and Apple Mail show the Onetime Secret logo next to email we send
from `@onetimesecret.com`. This static site's only job in BIMI is to host two
files over HTTPS. Everything else lives in DNS and at a certificate authority.

## Current status

| Requirement                                   | State                                      |
| --------------------------------------------- | ------------------------------------------ |
| DMARC at enforcement (`p=reject`, `pct=100`)  | Done (`_dmarc.onetimesecret.com`)          |
| SVG Tiny P/S logo hosted over HTTPS           | Done (`/bimi/logo.svg`, guarded by tests)  |
| BIMI DNS record (`default._bimi`)             | Exists, but the `a=` tag is empty          |
| Verified Mark Certificate (VMC) hosted        | **Missing** – must be purchased and added  |

The checker output "BIMI certificate location missing" and "BIMI certificate not
valid" both come from the empty `a=` tag. The site can be fully ready on its
side; the logo will still not appear in Gmail or Apple Mail until a certificate
is issued and published.

## What lives in this repo

| Path                        | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `public/bimi/logo.svg`      | The BIMI indicator. Served at `https://onetimesecret.com/bimi/logo.svg`. |
| `public/bimi/vmc.pem`       | The VMC certificate chain (not yet present, see step 2).       |
| `test/unit/bimi/logo.test.ts` | Enforces the SVG P/S profile rules and pins the logo's hash.   |

`public/bimi/` is a dedicated, stable location. Do not move, rename or "optimise"
files in it. A VMC embeds a SHA-256 hash of the exact SVG bytes; if the served
file differs by one byte the certificate is invalid and providers drop the logo.
The unit test will fail if the logo changes, which is intentional.

The certificate PEM contains only public certificates. It is safe and expected
to commit it. Never commit the private key or the CSR key used to order it.

## Step 1: Confirm the logo is served correctly

After the next production deploy:

```bash
curl -sI https://onetimesecret.com/bimi/logo.svg | grep -iE '^(HTTP|content-type)'
# HTTP/2 200
# content-type: image/svg+xml
```

The response must be `200` with no redirect and content type `image/svg+xml`.
BunnyCDN already serves `.svg` files this way (verified on the existing
`/logo.svg`).

## Step 2: Obtain a certificate

Gmail and Apple Mail require a certificate. Yahoo does not, but we want all
three. Two certificate types exist, both issued by the same CAs (DigiCert,
Entrust, GlobalSign, SSL.com):

- **VMC (Verified Mark Certificate)**: requires a registered trademark for the
  logo with an accepted trademark office (USPTO, EUIPO, UKIPO, CIPO, JPO and
  others). Shows the logo and, in Gmail, the blue verified checkmark.
- **CMC (Common Mark Certificate)**: no trademark needed, but the logo must
  have been in continuous public use for at least 12 months (the CA checks
  evidence such as the Wayback Machine). Shows the logo without the checkmark.

When ordering:

1. Upload the exact file from `public/bimi/logo.svg` (download it from the live
   site after deploy, or copy it from the repo at the deployed commit). Do not
   let the CA "convert" or re-save it; if they must, put their version back into
   the repo and update the pinned hash in the test in the same commit.
2. Complete organisation validation (business registration, a verification
   call). Expect a few business days.
3. Generate the key pair and CSR on a machine you control. The CA never needs
   the private key and neither does this site.
4. Download the certificate as a **PEM chain**: leaf certificate first, followed
   by the intermediate(s). Most CAs offer this as a single file.

## Step 3: Publish the certificate

1. Save the PEM chain as `public/bimi/vmc.pem` and commit it to `main`.
   The production deploy workflow uploads everything in `public/` to BunnyCDN
   and purges the cache.
2. Verify it is reachable:

   ```bash
   curl -sI https://onetimesecret.com/bimi/vmc.pem | grep -iE '^(HTTP|content-type)'
   curl -s https://onetimesecret.com/bimi/vmc.pem | openssl x509 -noout -subject -dates
   ```

   The response must be `200` without redirects. The BIMI VMC specification
   expects the content type `application/pem-certificate-chain`. BunnyCDN picks
   the content type from the file extension, so check the header above; if it
   is not `application/pem-certificate-chain`, add a BunnyCDN Edge Rule on the
   pull zone: *Override Response Header* for URL `https://onetimesecret.com/bimi/*.pem`
   setting `Content-Type` to `application/pem-certificate-chain`.

## Step 4: Update the DNS record

Current record:

```
default._bimi.onetimesecret.com. TXT "v=BIMI1; l=https://onetimesecret.com/v3/img/onetime-logo-v3-xl.svg; a=;"
```

Replace it with:

```
default._bimi.onetimesecret.com. TXT "v=BIMI1; l=https://onetimesecret.com/bimi/logo.svg; a=https://onetimesecret.com/bimi/vmc.pem"
```

Notes:

- The `l=` URL moves to `/bimi/logo.svg`. The old path keeps working, but the
  new file carries a `viewBox` so clients scale it correctly, and it is the file
  the certificate will be bound to.
- Both URLs must be `https://` and must serve the file directly (no redirects).
- Keep the record on the `default` selector unless outbound mail is signed with
  a `BIMI-Selector` header.
- Do not publish the `a=` value before the PEM is live; an unreachable
  certificate URL is treated as a failed BIMI check.

## Step 5: Verify end to end

```bash
# DNS (dig is not always installed; this works anywhere)
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=default._bimi.onetimesecret.com&type=TXT'
```

Then run a third-party check, for example the BIMI Group inspector
(`https://bimigroup.org/bimi-generator/`), Mailhardener or EasyDMARC. All of
them re-run the same checks that produced the original "certificate location
missing" report.

Finally send a message from `@onetimesecret.com` to a Gmail account. Gmail can
take up to 48 hours after DNS changes to start displaying the logo, and it also
requires a healthy sending reputation for the domain.

## Ongoing maintenance

- VMCs and CMCs are valid for one year. Put the expiry in the ops calendar; a
  renewal with the same logo only needs the new PEM committed over the old one.
- Any brand refresh that changes `public/bimi/logo.svg` needs a re-issued
  certificate. Ship the new SVG, the new PEM and the updated hash pin in the test
  together, in a single deploy.
- DMARC must stay at `p=reject` (or `p=quarantine` with `pct=100`) and must not
  set `sp=none`. Weakening it disables BIMI immediately.
