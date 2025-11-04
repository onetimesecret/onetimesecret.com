# Translation Quality Review - GitHub Issue for docs.onetimesecret.com

**Repository:** onetimesecret/docs.onetimesecret.com
**Title:** Enhance Translation Documentation Based on Quality Review
**Labels:** documentation, i18n, enhancement

---

## Translation Quality Review Findings

I've completed a comprehensive review of the translation quality for the main onetimesecret.com website. Here are the key findings and recommendations:

### Current Locale Quality Ratings

| Locale | Rating | Status | Notes |
|--------|--------|--------|-------|
| 🇫🇷 French | 3/3 (Great) | ✅ Production-ready | Excellent consistency, proper formality |
| 🇩🇪 German | 2/3 (Passable) → 3/3 | ✅ Fixed | Had 2 formality inconsistencies (now corrected) |
| 🇬🇧 English | 3/3 (Great) | ✅ Fixed | Had 1 empty value (now filled) |

### Key Findings

**Structural Completeness:**
- All three locales maintain identical structure (165 translation keys each)
- No missing keys across any locale
- Proper JSON structure and formatting

**Terminology Consistency:**
- ✅ Technical terms properly localized (GDPR→DSGVO/RGPD)
- ✅ Legal terminology culturally appropriate
- ✅ "Passphrase" handled correctly (German: "Passphrase", French: "phrase de passe")
- ✅ Professional role titles well-translated

**Issues Found & Fixed:**
1. German: 2 instances mixing informal "du/dein" with formal "Sie/Ihre" (fixed in PR)
2. English: Missing translation for "Data Residency" (fixed in PR)

### Recommendations for Translation Documentation

**1. Create Formal Translation Glossary**

The docs should include a glossary page with these critical terms:

| English | German (de) | French (fr) | Spanish (es) | Notes |
|---------|-------------|-------------|--------------|-------|
| Secret | Geheimnis | secret | secreto | Core product term |
| Passphrase | Passphrase | phrase de passe | frase de contraseña | Security feature |
| Link | Link | lien | enlace | Core functionality |
| Data Residency | Datenresidenz | Résidence des données | Residencia de datos | Compliance feature |
| GDPR | DSGVO | RGPD | RGPD | Legal compliance |
| Privacy Policy | Datenschutzerklärung | Politique de confidentialité | Política de privacidad | Legal document |
| Self-destructing | Selbstzerstörend | auto-destructible | autodestructible | Core feature |

**2. Update Translation Style Guide**

Add specific sections covering:

- **Formality Levels:**
  - German: MUST use formal "Sie/Ihr/Ihre" consistently (never mix with "du/dein")
  - French: MUST use formal "vous/votre/vos" consistently
  - Spanish: MUST use formal "usted/su" consistently
  - Rationale: Professional B2B security service requires consistent formality

- **Technical Term Handling:**
  - Some English tech terms may remain in target language if commonly used (e.g., "Passphrase" in German)
  - Legal acronyms MUST be properly localized (GDPR→DSGVO/RGPD/etc.)
  - Product name "Onetime Secret" remains unchanged across all locales

- **Tone Consistency:**
  - Professional but approachable
  - Security-focused without being alarmist
  - Clear and accessible language (avoid overly complex terminology)

**3. Add Translation Quality Checklist**

For each new locale translation, reviewers should verify:

- [ ] Consistent formality level throughout (no mixing formal/informal)
- [ ] All 165+ translation keys present and filled
- [ ] Technical terms match glossary
- [ ] Legal terms culturally appropriate for target region
- [ ] Compliance acronyms properly localized (GDPR, HIPAA, etc.)
- [ ] No untranslated English fragments
- [ ] Professional role titles appropriate for locale
- [ ] Date/time formats follow locale conventions

### Recommended Next Languages (Priority Order)

**High Priority:**

1. **🇪🇸 Spanish (es)** - HIGHEST PRIORITY
   - 460M+ native speakers globally
   - Large market in Latin America and Spain
   - Similar Romance language structure to French
   - Growing cybersecurity awareness in Spanish-speaking markets
   - **Action:** Consider es-ES (European) vs es-MX/es-LA (Latin American) variants

2. **🇯🇵 Japanese (ja)**
   - Major technology market with high privacy awareness
   - Japan has strict data residency requirements (Perfect Cloud Act concerns)
   - Strong B2B software adoption
   - **Considerations:** Requires careful formality levels (keigo system)

3. **🇵🇹 Portuguese (pt-BR)**
   - Brazil is largest economy in Latin America (250M+ Portuguese speakers)
   - LGPD (Brazilian GDPR equivalent) creates compliance demand
   - Growing tech sector
   - **Action:** Focus on pt-BR (Brazilian) variant initially

**Medium Priority:**

4. **🇨🇳 Chinese Simplified (zh-CN)** - Large market, complex requirements
5. **🇮🇹 Italian (it)** - EU market with GDPR needs
6. **🇳🇱 Dutch (nl)** - Strong data privacy culture
7. **🇵🇱 Polish (pl)** - Large EU market

### Documentation Tasks

- [ ] Create `/translations/glossary/` page with standardized term translations
- [ ] Expand `/translations/guide/` with formality requirements
- [ ] Add translation quality checklist
- [ ] Document the i18n file structure for contributors
- [ ] Add examples of good vs. bad translations
- [ ] Create templates for new locale submissions

### References

- All translations are located in: `src/i18n/ui/*.json`
- i18n configuration: `config/astro/i18n.ts`
- Supported languages currently: en, fr, de
- Total translation keys: 165 per locale

---

**Related PR:** The German formality fixes and English empty value fix are included in the current PR for the main repo.
