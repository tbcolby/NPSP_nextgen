# Foundation & API Modernization Plan

## Executive Summary

This document outlines the architectural approach for upgrading NPSP_nextgen's foundational platform elements, primarily the Salesforce API version upgrade from 53.0 to 60.0+. This seemingly simple change has far-reaching implications for feature availability, security posture, and long-term maintainability.

**Decision**: Upgrade API version from 53.0 to 60.0 in a phased approach with comprehensive testing gates.

---

## 1. Current State Analysis

### 1.1 API Version Inventory

| Component Type | Count | Current API | Notes |
|----------------|-------|-------------|-------|
| Apex Classes | 1,689 | 53.0 | Uniform across all classes |
| Apex Triggers | 26 | 53.0 | TDTM pattern |
| LWC Components | 125 | 53.0 | Modern components |
| Aura Components | 35 | 37.0-53.0 | 1 component at v37.0 |
| Visualforce Pages | 79 | 53.0 | Legacy UI |
| Custom Objects | 37 | N/A | Schema only |

### 1.2 API 53.0 Limitations

API 53.0 (Winter '22) lacks access to features released in subsequent versions:

| Feature | Available Since | Impact |
|---------|-----------------|--------|
| Null-safe operators (`?.`, `??`) | API 50.0 | Code verbosity |
| Queueable Finalizer | API 54.0 | Error recovery |
| Security.stripInaccessible enhancements | API 48.0+ | Security patterns |
| LWC wire adapter improvements | API 55.0+ | Performance |
| Enhanced SOQL features | API 55.0+ | Query optimization |
| Platform Cache enhancements | API 56.0+ | Performance |
| Flow Builder improvements | API 57.0+ | Automation |

### 1.3 Technical Debt from Outdated API

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNICAL DEBT PYRAMID                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │     FEATURE GAP (Can't use modern capabilities)      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │   SECURITY GAP (Missing security enhancements)       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  PERFORMANCE GAP (Can't leverage optimizations)      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ MAINTAINABILITY (Verbose patterns, workarounds)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Target State Architecture

### 2.1 Target API Version: 60.0

**Rationale**: API 60.0 (Spring '24) provides:
- Stable release with 2+ years of production use
- All modern Apex language features
- Enhanced security capabilities
- Performance optimizations
- Not bleeding edge (avoids early-adopter issues)

### 2.2 Version Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                      API VERSION STRATEGY                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Current        Intermediate      Target         Future          │
│   ┌─────┐        ┌─────┐          ┌─────┐        ┌─────┐         │
│   │53.0 │───────▶│56.0 │─────────▶│60.0 │───────▶│ 63+ │         │
│   └─────┘        └─────┘          └─────┘        └─────┘         │
│                                                                   │
│   Winter '22     Winter '23       Spring '24     Future           │
│                                                                   │
│   [Optional stepping stone if issues discovered]                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Well-Architected Framework Alignment

### 3.1 Trusted

| Principle | How This Addresses It |
|-----------|----------------------|
| **Security by Default** | Newer API versions include security enhancements as defaults |
| **Least Privilege** | Enhanced `inherited sharing` and FLS capabilities |
| **Defense in Depth** | Access to `Security.stripInaccessible()` improvements |

### 3.2 Easy

| Principle | How This Addresses It |
|-----------|----------------------|
| **Intuitive Design** | Modern syntax (null-safe operators) improves readability |
| **Consistent Experience** | Uniform API version across all components |
| **Clear Feedback** | Better error messages in newer API versions |

### 3.3 Adaptable

| Principle | How This Addresses It |
|-----------|----------------------|
| **Flexible Configuration** | Access to Custom Metadata Type enhancements |
| **Extensibility** | Modern patterns enable cleaner extension points |
| **Future-Ready** | Closer to current API reduces future upgrade burden |

### 3.4 Intentional

| Principle | How This Addresses It |
|-----------|----------------------|
| **Purpose-Driven** | Each API feature unlocked has specific use case |
| **Measured Impact** | Clear before/after metrics for code quality |
| **Documented Decisions** | This document captures rationale |

### 3.5 Automated

| Principle | How This Addresses It |
|-----------|----------------------|
| **CI/CD Integration** | API version validated in pipeline |
| **Automated Testing** | Full regression suite gates upgrade |
| **Monitoring** | Track deprecation warnings post-upgrade |

---

## 4. Trade-off Analysis

### 4.1 Option 1: Big Bang Upgrade (53.0 → 60.0)

**Approach**: Single upgrade of all components simultaneously

| Pros | Cons |
|------|------|
| Simpler to implement | Higher risk of hidden issues |
| Single testing cycle | Larger blast radius if problems |
| Immediate access to all features | Harder to isolate root cause |
| Clear milestone | May overwhelm test capacity |

**Risk Level**: Medium-High

### 4.2 Option 2: Phased Upgrade (53.0 → 56.0 → 60.0)

**Approach**: Two-step upgrade with validation between

| Pros | Cons |
|------|------|
| Reduced risk per step | Longer timeline |
| Easier issue isolation | Two testing cycles required |
| Can pause if issues found | Intermediate state to maintain |
| Validates upgrade process | More release coordination |

**Risk Level**: Low-Medium

### 4.3 Option 3: Component-by-Component Upgrade

**Approach**: Upgrade individual classes/components incrementally

| Pros | Cons |
|------|------|
| Minimal risk per change | Very long timeline |
| Easy to test individual changes | Mixed API versions in codebase |
| Can prioritize critical components | Inconsistent developer experience |
| Gradual adoption | Harder to track progress |

**Risk Level**: Low but High Complexity

### 4.4 Recommended Approach

**Decision**: Option 1 (Big Bang) with comprehensive testing gates

**Rationale**:
1. Salesforce guarantees API backwards compatibility
2. NPSP has comprehensive test coverage (85%+)
3. Phased approach adds complexity without proportional risk reduction
4. Community can test in scratch orgs before adoption
5. Rollback is simple (revert sfdx-project.json)

---

## 5. Risk Assessment

### 5.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Deprecated method removal | Low | High | Pre-upgrade deprecation scan |
| Behavior change in existing code | Low | Medium | Full regression test suite |
| Test failures from stricter validation | Medium | Low | Fix tests before merge |
| Third-party package conflicts | Low | Medium | Document package requirements |

### 5.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extended testing cycle | Medium | Low | Parallelize testing |
| Community confusion | Low | Low | Clear release notes |
| Adoption hesitation | Medium | Medium | Sandbox testing guidance |

### 5.3 Risk Matrix

```
           │ Low Impact │ Medium Impact │ High Impact │
───────────┼────────────┼───────────────┼─────────────┤
High       │            │               │             │
Likelihood │            │               │             │
───────────┼────────────┼───────────────┼─────────────┤
Medium     │ Test       │ Adoption      │             │
Likelihood │ failures   │ hesitation    │             │
───────────┼────────────┼───────────────┼─────────────┤
Low        │            │ Package       │ Deprecated  │
Likelihood │            │ conflicts     │ methods     │
───────────┴────────────┴───────────────┴─────────────┘
```

---

## 6. Migration Strategy

### 6.1 Pre-Migration Phase (Week 1-2)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRE-MIGRATION CHECKLIST                   │
├─────────────────────────────────────────────────────────────┤
│ □ Run PMD deprecation scan on all Apex                      │
│ □ Identify any @deprecated method usage                     │
│ □ Review Salesforce release notes for breaking changes      │
│ □ Create upgrade branch                                     │
│ □ Establish baseline test pass rate                         │
│ □ Document current code coverage percentage                 │
│ □ Notify community of planned upgrade                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Migration Phase (Week 3)

**Step 1**: Update sfdx-project.json
```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true
    }
  ],
  "namespace": "npsp",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "60.0"  // Changed from 53.0
}
```

**Step 2**: Update all metadata files
```bash
# Script to update all -meta.xml files
find force-app -name "*-meta.xml" -exec sed -i '' 's/53.0/60.0/g' {} \;
```

**Step 3**: Address any immediate compilation errors

### 6.3 Validation Phase (Week 4-5)

| Gate | Criteria | Owner |
|------|----------|-------|
| Gate 1 | All classes compile | Automated |
| Gate 2 | All LWC lint passes | Automated |
| Gate 3 | Unit tests pass (85%+) | Automated |
| Gate 4 | Integration tests pass | Automated |
| Gate 5 | Manual smoke test | QA |
| Gate 6 | Performance baseline met | Automated |

### 6.4 Post-Migration Phase (Week 6+)

```
┌─────────────────────────────────────────────────────────────┐
│                   POST-MIGRATION ACTIVITIES                  │
├─────────────────────────────────────────────────────────────┤
│ □ Update CLAUDE.md with new API version                     │
│ □ Update contributor documentation                          │
│ □ Publish release notes                                     │
│ □ Monitor community feedback                                │
│ □ Track any regression reports                              │
│ □ Begin leveraging new API features                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Details

### 7.1 Files Requiring Updates

| File Pattern | Count | Update Type |
|--------------|-------|-------------|
| `sfdx-project.json` | 1 | sourceApiVersion |
| `*.cls-meta.xml` | 1,689 | apiVersion |
| `*.trigger-meta.xml` | 26 | apiVersion |
| `*.cmp-meta.xml` | 35 | apiVersion |
| `*.page-meta.xml` | 79 | apiVersion |
| `*.js-meta.xml` | 125 | apiVersion |

### 7.2 Automation Script

```bash
#!/bin/bash
# api-version-upgrade.sh

NEW_VERSION="60.0"
OLD_VERSION="53.0"

echo "Upgrading API version from $OLD_VERSION to $NEW_VERSION"

# Update sfdx-project.json
sed -i '' "s/\"sourceApiVersion\": \"$OLD_VERSION\"/\"sourceApiVersion\": \"$NEW_VERSION\"/" sfdx-project.json

# Update all metadata files
find force-app -name "*-meta.xml" -type f | while read file; do
    sed -i '' "s/<apiVersion>$OLD_VERSION<\/apiVersion>/<apiVersion>$NEW_VERSION<\/apiVersion>/" "$file"
    sed -i '' "s/<apiVersion>37.0<\/apiVersion>/<apiVersion>$NEW_VERSION<\/apiVersion>/" "$file"
done

echo "API version upgrade complete. Run tests to validate."
```

### 7.3 Validation Script

```bash
#!/bin/bash
# validate-api-upgrade.sh

echo "Validating API version upgrade..."

# Check all meta.xml files have correct version
INCORRECT=$(grep -r "apiVersion>53.0" force-app | wc -l)
if [ "$INCORRECT" -gt 0 ]; then
    echo "ERROR: $INCORRECT files still have old API version"
    exit 1
fi

# Run tests
echo "Running test suite..."
cci task run run_tests --org dev -o retry_failures True

echo "Validation complete."
```

---

## 8. Success Metrics

### 8.1 Technical Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| API Version | 53.0 | 60.0 | sfdx-project.json |
| Test Pass Rate | 100% | 100% | CI/CD |
| Code Coverage | 85% | 85%+ | CI/CD |
| PMD Violations | TBD | Same or lower | CI/CD |
| Build Time | TBD | Within 10% | CI/CD |

### 8.2 Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Community scratch org testing | 10+ orgs | GitHub feedback |
| Regression reports | 0 critical | GitHub issues |
| Documentation completeness | 100% | PR checklist |

---

## 9. Dependencies

### 9.1 Upstream Dependencies

| Dependency | Description | Status |
|------------|-------------|--------|
| CumulusCI | Build tool must support target API | ✓ Supported |
| SFDX CLI | CLI must support target API | ✓ Supported |
| GitHub Actions | Runners must have compatible tools | ✓ Supported |

### 9.2 Downstream Dependencies

| Dependent Item | Impact |
|----------------|--------|
| Security Hardening (Plan 02) | Can use newer security features |
| Async Modernization (Plan 03) | Unlocks Queueable Finalizer |
| Performance (Plan 04) | Unlocks query optimizations |

---

## 10. Rollback Plan

### 10.1 Rollback Trigger Criteria

- More than 5% test failure rate
- Critical functionality broken
- Security vulnerability introduced
- Community reports widespread issues

### 10.2 Rollback Procedure

```bash
# Rollback to previous API version
git revert <upgrade-commit-sha>
git push origin main

# Or reset to pre-upgrade state
git reset --hard <pre-upgrade-commit-sha>
git push --force origin main  # Requires maintainer approval
```

### 10.3 Rollback Communication

1. Post GitHub issue explaining rollback
2. Update release notes
3. Communicate timeline for re-attempt

---

## 11. Appendix

### A. Salesforce API Version History

| API Version | Release | Key Features |
|-------------|---------|--------------|
| 53.0 | Winter '22 | Current NPSP version |
| 54.0 | Spring '22 | Queueable Finalizer |
| 55.0 | Summer '22 | Enhanced SOQL |
| 56.0 | Winter '23 | Platform Cache improvements |
| 57.0 | Spring '23 | Flow improvements |
| 58.0 | Summer '23 | Various enhancements |
| 59.0 | Winter '24 | Security enhancements |
| 60.0 | Spring '24 | **Target version** |

### B. Deprecated Methods Scan Results

To be populated during pre-migration phase.

### C. Related Documents

- [02-SECURITY-ARCHITECTURE.md](02-SECURITY-ARCHITECTURE.md) - Security implications
- [03-ASYNC-APEX-MODERNIZATION.md](03-ASYNC-APEX-MODERNIZATION.md) - Finalizer pattern
- [MODERNIZATION_BURNDOWN.md](../documentation/MODERNIZATION_BURNDOWN.md) - Task tracking

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
