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

The logo file satisfies the SVG P/S profile and Gmail's additions: an absolute
pixel size of at least 96 (it is 1445 x 1445), a solid background, a `title`,
a `desc` for accessibility, and a size under 32 KB.

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

A record with an empty `a=` tag is a "self-asserted" logo. The BIMI Group
lists Yahoo, Fastmail and La Poste as providers that display self-asserted
logos. Gmail requires a VMC or CMC. Apple Mail (iOS 16, macOS Ventura 13 and
later, and iCloud.com) requires a VMC or another BIMI Evidence Document. Two
certificate types exist.
Both are issued by the Mark Verifying Authorities listed by the BIMI Group,
currently DigiCert, Entrust, GlobalSign and SSL.com
(`https://bimigroup.org/vmc-issuers/`):

- **VMC (Verified Mark Certificate)**: requires a registered trademark for the
  logo with an accepted trademark office (USPTO, EUIPO, UKIPO and others listed
  in the BIMI Group's VMC guidelines). Gmail shows the logo with the blue
  verified checkmark.
- **CMC (Common Mark Certificate)**: no trademark needed. For a "Prior Use
  Mark" the CA verifies that a matching logo is displayed on a website whose
  domain we control, and that the same logo was displayed on that domain at
  least 12 months earlier, checked through an approved web archive such as
  the Wayback Machine. Gmail has supported CMCs since September 2024 and shows
  the logo without the checkmark.

When ordering:

1. Upload the exact file from `public/bimi/logo.svg` (download it from the live
   site after deploy, or copy it from the repo at the deployed commit). Do not
   let the CA "convert" or re-save it; if they must, put their version back into
   the repo and update the pinned hash in the test in the same commit.
2. Complete organisation validation (business registration, a verification
   call). Expect a few business days.
3. Generate the key pair and CSR on a machine you control. The CA never needs
   the private key and neither does this site.
4. Download the certificate as a **PEM chain**. The VMC fetch specification
   (draft-fetch-validation-vmc) requires PEM encoding with the full issuance
   chain present, ordered VMC first, then its issuer, then any further
   intermediates, with the root optional. Gmail's guide says to append the
   intermediate and root certificates in that order, so include the root.
   Out-of-order or duplicated certificates may be rejected. Most CAs offer
   the chain as a single file.

## Step 3: Publish the certificate

1. Save the PEM chain as `public/bimi/vmc.pem` and commit it to `main`.
   The production deploy workflow uploads everything in `public/` to BunnyCDN
   and purges the cache.
2. Verify it is reachable:

   ```bash
   curl -sI https://onetimesecret.com/bimi/vmc.pem | grep -iE '^(HTTP|content-type)'
   curl -s https://onetimesecret.com/bimi/vmc.pem | openssl x509 -noout -subject -dates
   ```

   The response must be `200` over HTTPS with no redirect, and the body must
   start with `-----BEGIN CERTIFICATE-----`. The specification requires the
   `.pem` file extension in the URL but does not mandate a Content-Type.
   Bunny Storage records a Content-Type only if the uploader sends one, and
   otherwise serves the file with a type derived from the extension. If a
   validator objects to the header it returns, add an Edge Rule on the pull
   zone with the *Set Response Header* action for
   `https://onetimesecret.com/bimi/*.pem`, setting `Content-Type` to
   `application/pem-certificate-chain`.

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
  new file carries a `viewBox` and a `desc`, and it is the file the certificate
  will be bound to.
- Gmail's own example record leaves `l=` empty when `a=` is set, because the
  logo is embedded in the certificate. Keep `l=` populated anyway: providers
  that accept self-asserted logos (Yahoo, Fastmail, La Poste) read it.
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

Finally send a message from `@onetimesecret.com` to a Gmail account. Google
states it can take up to 48 hours after the DNS record is added for the logo
to appear, and display also depends on the domain's sending reputation.

## Sources

- BIMI assertion record: `draft-brand-indicators-for-message-identification`
  (section 4.2 for the `l=` and `a=` tags, section 7 for DMARC prerequisites).
- Logo profile: `draft-svg-tiny-ps-abrotman` (section 2), enforced by
  `test/unit/bimi/logo.test.ts`.
- Certificate hosting: `draft-fetch-validation-vmc-wchuang` (section 3).
- Gmail requirements: `https://knowledge.workspace.google.com/admin/security/set-up-bimi`.
- Apple Mail support: `https://support.apple.com/en-us/HT213155`.
- BunnyCDN storage uploads and Edge Rules: `https://bunny.net/docs/storage/http`
  and `https://bunny.net/docs/cdn/edge-rules`.
- Certificate types and issuers: `https://bimigroup.org/vmc-issuers/` and the
  BIMI Group's "Minimum Security Requirements for Issuance of Mark
  Certificates" (sections 3.2.16 and 3.2.17).

## Ongoing maintenance

- Mark certificates are valid for at most 398 days. Put the expiry in the ops
  calendar. A renewal with the same
  logo only needs the new PEM published. Receivers may cache the certificate
  by URL, so publish the renewed chain under a new filename (for example
  `vmc-2027.pem`) and update the `a=` tag, rather than overwriting in place.
- Any brand refresh that changes `public/bimi/logo.svg` needs a re-issued
  certificate. Ship the new SVG, the new PEM and the updated hash pin in the test
  together, in a single deploy.
- DMARC must stay at `p=reject` (or `p=quarantine` with `pct=100`) and must not
  set `sp=none`. Weakening it disables BIMI immediately.
