# CLI Tools

This directory contains command-line tools for development, testing, and operations.

## test-cors

A comprehensive CORS (Cross-Origin Resource Sharing) testing tool written in Python that validates API endpoint configurations across different origins and regions.

### Features

- ✅ Test CORS preflight (OPTIONS) requests
- ✅ Test actual API requests with CORS headers
- ✅ Smart testing: skips actual requests when preflight fails
- ✅ Batch testing multiple origins
- ✅ Full test suite across all regions
- ✅ Color-coded output for easy debugging
- ✅ Detailed header inspection
- ✅ Proper exit codes for CI/CD integration

### Requirements

- Python 3.7+
- `requests` library

Install dependencies:
```bash
pip install requests
```

### Installation

The script is located at `bin/test-cors` and is executable. Add it to your PATH or run directly:

```bash
# Run directly
./bin/test-cors --help

# Or add bin/ to your PATH
export PATH="$PATH:$(pwd)/bin"
test-cors --help
```

### Usage

#### Test Single Origin

Test a single origin against an API endpoint:

```bash
test-cors <api-endpoint> <origin> [method]
```

Example:
```bash
test-cors https://eu.onetimesecret.com/api/v2/secret/conceal https://onetimesecret.com
```

#### Batch Test Multiple Origins

Test multiple origins against the same endpoint:

```bash
test-cors --batch <api-endpoint> --origins <origin1> <origin2> ...
```

Example:
```bash
test-cors --batch https://eu.onetimesecret.com/api/v2/secret/conceal \
  --origins https://onetimesecret.com https://www.onetimesecret.com http://localhost:4321
```

#### Run Full Test Suite

Run comprehensive tests across all regions and origins:

```bash
test-cors --full
```

This tests all combinations of:
- **Regions**: EU, CA, US, NZ
- **Origins**: onetimesecret.com, www.onetimesecret.com, localhost:4321

### Smart Testing

The tool intelligently avoids unnecessary requests:
- **Preflight test always runs** - Tests CORS configuration via OPTIONS request
- **Actual request runs conditionally** - Only executes if preflight passes
- **Saves time and resources** - No point testing actual requests when CORS is misconfigured

This behavior can be seen in the output:
```
⚠ Skipping actual request test because preflight failed
```

### Output

The tool provides color-coded output (can be disabled with `--no-color`):

- ✓ **Green** - CORS headers present and valid
- ✗ **Red** - CORS headers missing or invalid
- ⚠ **Yellow** - Partial CORS configuration or warnings
- ℹ **Blue** - Informational messages

### CORS Headers Checked

The tool validates the following CORS headers:

1. `access-control-allow-origin` - Specifies allowed origins
2. `access-control-allow-methods` - Specifies allowed HTTP methods
3. `access-control-allow-headers` - Specifies allowed request headers
4. `access-control-allow-credentials` - Indicates if credentials are allowed
5. `access-control-max-age` - Specifies preflight cache duration

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

### Examples

#### Example 1: Debug a specific CORS issue

```bash
# Test if www subdomain has CORS issues
test-cors https://eu.onetimesecret.com/api/v2/secret/conceal https://www.onetimesecret.com
```

#### Example 2: Verify CORS works from localhost

```bash
# Test local development setup
test-cors https://eu.onetimesecret.com/api/v2/secret/conceal http://localhost:4321
```

#### Example 3: Compare multiple origins

```bash
# Batch test to compare configurations
test-cors --batch https://eu.onetimesecret.com/api/v2/secret/conceal \
  --origins https://onetimesecret.com https://www.onetimesecret.com
```

#### Example 4: Verify all regions after config change

```bash
# Run full test suite after deploying CORS changes
test-cors --full
```

### Use Cases

1. **Pre-deployment validation** - Verify CORS configuration before deploying backend changes
2. **Debugging user issues** - Reproduce and diagnose CORS-related errors
3. **Cross-region testing** - Ensure consistent CORS configuration across all regions
4. **CI/CD integration** - Add to automated tests to catch CORS regressions

### Troubleshooting

**Issue:** Script shows "Failed to connect to endpoint"

**Solution:** Check network connectivity and ensure the endpoint URL is correct

---

**Issue:** All headers show as MISSING

**Solution:** The API server may not be configured for CORS or the origin is not in the allowlist

---

**Issue:** Some headers present, some missing

**Solution:** Partial CORS configuration - review backend CORS middleware settings

### Related Documentation

- [CORS Investigation Report](../CORS-INVESTIGATION.md) - Detailed analysis of Firefox CORS issues
- [API Documentation](../docs/api.md) - API endpoint reference

### Technical Details

**Language:** Python 3.7+

**Dependencies:**
- `requests` - HTTP library for making requests
- Standard library modules: `argparse`, `sys`, `dataclasses`, `enum`, `typing`, `urllib.parse`

**Architecture:**
- Object-oriented design with `CORSTester` class
- Type hints for better code maintainability
- Dataclasses for structured results
- Enum for test status tracking
