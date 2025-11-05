# CORS Investigation Findings - EU Site Configuration

**Date:** 2025-11-05
**Issue:** Firefox CORS errors when creating secrets on onetimesecret.com using EU backend
**Status:** Backend configuration issue identified

## Executive Summary

The CORS (Cross-Origin Resource Sharing) errors reported by Firefox users are caused by **missing CORS headers on the backend API server** (eu.onetimesecret.com), not the frontend. The frontend configuration is correct and properly allows connections to the regional endpoints.

## Technical Analysis

### 1. Frontend Configuration (✅ Correct)

The frontend (this repository) is properly configured:

- **CSP Policy** (src/components/layout/LayoutHead.astro:145):
  - Includes `eu.onetimesecret.com` in `connect-src` directive
  - Location: src/utils/security.ts:17

- **API Call** (src/components/vue/forms/SecretForm.vue:165-174):
  - Makes POST request to `${apiBaseUrl}/api/v2/secret/conceal`
  - Properly includes Content-Type header
  - Uses standard fetch API

- **Jurisdiction Configuration** (src/data/ops/jurisdictions.ts):
  - EU domain correctly set to "eu.onetimesecret.com"
  - Store properly manages API base URLs

### 2. The CORS Problem (❌ Backend Issue)

When a user on `onetimesecret.com` tries to create a secret stored in the EU:

1. **Browser sends OPTIONS preflight request** to:
   ```
   https://eu.onetimesecret.com/api/v2/secret/conceal
   ```

2. **Backend returns 204 status** (typical for OPTIONS)
   - BUT is missing the required CORS headers:
     - `Access-Control-Allow-Origin`
     - `Access-Control-Allow-Methods`
     - `Access-Control-Allow-Headers`

3. **Browser blocks the actual POST request** because preflight failed

### 3. Error Messages Explained

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the
remote resource at https://eu.onetimesecret.com/api/v2/secret/conceal.
(Reason: CORS header 'Access-Control-Allow-Origin' missing).
Status code: 204.
```

- **Status 204**: Indicates the OPTIONS preflight request completed
- **Missing header**: Backend didn't return `Access-Control-Allow-Origin`
- **Firefox-specific**: Firefox has stricter CORS enforcement than Chrome/Edge

## Required Backend Configuration

The backend API server (https://github.com/onetimesecret/onetimesecret) needs to:

### 1. Handle OPTIONS Preflight Requests

For endpoint: `/api/v2/secret/conceal`

**Required Response Headers:**
```
Access-Control-Allow-Origin: https://onetimesecret.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### 2. Include CORS Headers on POST Responses

**Required Response Headers:**
```
Access-Control-Allow-Origin: https://onetimesecret.com
Access-Control-Allow-Credentials: false
```

### 3. Configuration Examples

#### Nginx Configuration:
```nginx
location /api/v2/secret/conceal {
    # Handle preflight OPTIONS request
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://onetimesecret.com' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Content-Length' 0;
        return 204;
    }

    # Add CORS headers to actual responses
    add_header 'Access-Control-Allow-Origin' 'https://onetimesecret.com' always;

    # Proxy to backend
    proxy_pass http://backend;
}
```

#### Ruby/Sinatra Configuration (if applicable):
```ruby
before do
  headers['Access-Control-Allow-Origin'] = 'https://onetimesecret.com'
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

options '/api/v2/secret/conceal' do
  headers['Access-Control-Max-Age'] = '86400'
  204
end
```

#### Node.js/Express Configuration:
```javascript
app.use('/api/v2/secret/conceal', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://onetimesecret.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }
  next();
});
```

## Testing Checklist

After implementing the backend changes, verify:

- [ ] OPTIONS request to `/api/v2/secret/conceal` returns proper CORS headers
- [ ] POST request to `/api/v2/secret/conceal` returns proper CORS headers
- [ ] Firefox can create secrets (test on Windows 11 and macOS)
- [ ] Chrome/Edge still work (regression testing)
- [ ] All regional endpoints (EU, CA, NZ, US) have consistent CORS configuration

## Testing Commands

```bash
# Test OPTIONS preflight
curl -X OPTIONS https://eu.onetimesecret.com/api/v2/secret/conceal \
  -H "Origin: https://onetimesecret.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Expected headers in response:
# Access-Control-Allow-Origin: https://onetimesecret.com
# Access-Control-Allow-Methods: POST, OPTIONS
# Access-Control-Allow-Headers: Content-Type
```

## Additional Considerations

### 1. Security
- CORS headers should be specific to `https://onetimesecret.com` (not wildcard `*`)
- Avoid `Access-Control-Allow-Credentials: true` unless needed
- Consider rate limiting on OPTIONS requests

### 2. All Regional Endpoints
Apply the same CORS configuration to:
- ✅ eu.onetimesecret.com
- ✅ ca.onetimesecret.com
- ✅ nz.onetimesecret.com
- ✅ us.onetimesecret.com

### 3. Monitoring
Add logging for:
- OPTIONS preflight requests
- CORS-related errors
- Browser/origin statistics

## References

- Frontend CSP configuration: `src/utils/security.ts:17`
- API call implementation: `src/components/vue/forms/SecretForm.vue:165`
- Jurisdiction configuration: `src/data/ops/jurisdictions.ts`
- Backend repository: https://github.com/onetimesecret/onetimesecret

## Next Steps

1. **Immediate**: Deploy CORS headers to eu.onetimesecret.com backend
2. **Follow-up**: Apply same configuration to CA, NZ, US backends
3. **Verify**: Test with Firefox on Windows 11 and macOS
4. **Monitor**: Track CORS errors in server logs/Sentry

---

**Note**: This is a backend configuration issue. No changes to this frontend repository are required.
