# bunnycdn_errors

Static error pages for the **marketing** pull zone (onetimesecret.com), whose
origin is a Bunny storage zone.

| File | Served when |
| --- | --- |
| `404.html` | storage zone "custom 404 file path" is set to `/bunnycdn_errors/404.html` |
| `500.html`, `503.html` | pasted into the marketing pull zone's custom error page |

Relative `/fonts/` and `/` links are correct here and only here: they resolve
against the marketing site.

The **regional** zones (eu, ca, nz, us, uk) do not use these files. Their
origin is the Ruby app, so anything relative would point at the thing that
just failed. They get `edge/error-page/regional.html`, pushed by
`pnpm edge:error-page:push`. See `edge/README.md`.
