# Code Quality Standards Plan

## Executive Summary

This document establishes the code quality standards, patterns, and enforcement mechanisms for NPSP_nextgen. It covers Apex, LWC, and general development practices that ensure maintainability, readability, and consistency across the codebase.

**Core Principle**: Consistent, well-documented code that any contributor can understand and maintain.

---

## 1. Current State Analysis

### 1.1 Code Quality Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODE QUALITY SNAPSHOT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Test Coverage          ████████████████░░░░  85%+              │
│  ApexDoc Coverage       ████████░░░░░░░░░░░░  ~40%              │
│  JSDoc Coverage         ██████░░░░░░░░░░░░░░  ~30%              │
│  PMD Compliance         ████████████░░░░░░░░  ~60%              │
│  ESLint Compliance      ██████████████░░░░░░  ~70%              │
│  Naming Conventions     ████████████████░░░░  ~80%              │
│                                                                  │
│  TODO/FIXME Comments: 48                                         │
│  Deprecated Methods: 2 files                                     │
│  Broad Exceptions: 571 instances                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Documentation Gaps

| Category | Total | Documented | Gap |
|----------|-------|------------|-----|
| API Classes (*_API) | 15 | ~5 | 10 |
| Service Classes | 40+ | ~15 | 25+ |
| Controllers | 50+ | ~20 | 30+ |
| TDTM Handlers | 49 | ~20 | 29 |
| LWC Components | 125 | ~40 | 85 |

---

## 2. Code Standards

### 2.1 Apex Naming Conventions

```
┌─────────────────────────────────────────────────────────────────┐
│                    APEX NAMING CONVENTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CLASSES                                                         │
│  ├─ Services:       {Domain}_{Function}_SVC or {Domain}Service  │
│  ├─ Controllers:    {Domain}_{Function}_CTRL                    │
│  ├─ TDTM Handlers:  {Domain}_{Object}_TDTM                      │
│  ├─ Batch Classes:  {Domain}_{Function}_BATCH                   │
│  ├─ Schedulables:   {Domain}_{Function}_SCHED                   │
│  ├─ Selectors:      {Domain}_{Object}_SEL or {Object}Selector   │
│  ├─ Test Classes:   {ClassName}_TEST                            │
│  └─ APIs:           {Domain}_{Function}_API                     │
│                                                                  │
│  DOMAIN PREFIXES                                                 │
│  ├─ RD2_  : Enhanced Recurring Donations                        │
│  ├─ CRLP_ : Customizable Rollups                                │
│  ├─ BDI_  : Batch Data Import                                   │
│  ├─ ALLO_ : Allocations                                         │
│  ├─ HH_   : Households                                          │
│  ├─ GE_   : Gift Entry                                          │
│  ├─ ERR_  : Error Handling                                      │
│  ├─ STG_  : Settings                                            │
│  ├─ UTIL_ : Utilities                                           │
│  └─ ADDR_ : Address Management                                  │
│                                                                  │
│  METHODS                                                         │
│  ├─ Getters:        get{PropertyName}()                         │
│  ├─ Setters:        set{PropertyName}(value)                    │
│  ├─ Booleans:       is{Condition}(), has{Property}()            │
│  ├─ Actions:        {verb}{Noun}() - e.g., calculateRollup()    │
│  └─ Handlers:       handle{Event}() - e.g., handleInsert()      │
│                                                                  │
│  VARIABLES                                                       │
│  ├─ Local vars:     camelCase                                   │
│  ├─ Constants:      UPPER_SNAKE_CASE                            │
│  ├─ Parameters:     camelCase                                   │
│  └─ Collections:    plural nouns - accounts, contactIds         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Apex Documentation Standards

**Class Documentation**:
```apex
/**
 * @description Service class for managing allocations across opportunities
 * and payments. Handles default allocation creation, validation, and
 * rollup calculations.
 *
 * @group Allocations
 * @group-content ../../ApexDocContent/Allocations.htm
 *
 * @author NPSP Team
 * @since 3.0
 */
public inherited sharing class ALLO_AllocationsService {
```

**Method Documentation**:
```apex
/**
 * @description Creates default allocations for the given opportunities
 * based on the configured default GAU. Skips opportunities that already
 * have allocations or are excluded by record type.
 *
 * @param opportunities List of opportunities to process
 * @return List of created Allocation__c records
 * @throws ALLO_Exception if default GAU is not configured
 *
 * @example
 * List<Allocation__c> allocations =
 *     ALLO_AllocationsService.createDefaultAllocations(opps);
 */
public static List<Allocation__c> createDefaultAllocations(
    List<Opportunity> opportunities
) {
```

### 2.3 LWC Naming Conventions

```
┌─────────────────────────────────────────────────────────────────┐
│                     LWC NAMING CONVENTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COMPONENTS                                                      │
│  ├─ Feature components: {domain}{Feature} - geFormRenderer      │
│  ├─ Utility components: util{Purpose} - utilInput, utilModal    │
│  └─ Service modules:    {domain}Service - geFormService         │
│                                                                  │
│  FILES                                                           │
│  ├─ Component folder:   camelCase - geFormRenderer              │
│  ├─ HTML file:          same as folder - geFormRenderer.html    │
│  ├─ JS file:            same as folder - geFormRenderer.js      │
│  ├─ CSS file:           same as folder - geFormRenderer.css     │
│  └─ Meta file:          same + -meta.xml                        │
│                                                                  │
│  JAVASCRIPT                                                      │
│  ├─ Public properties:  @api camelCase - @api recordId          │
│  ├─ Private properties: camelCase - isLoading                   │
│  ├─ Constants:          UPPER_SNAKE_CASE - MAX_RECORDS          │
│  ├─ Event handlers:     handle{Event} - handleClick             │
│  └─ Computed getters:   is/has prefix - get isDisabled()        │
│                                                                  │
│  CSS CLASSES                                                     │
│  ├─ BEM format:         slds-* for SLDS, c-* for custom         │
│  ├─ Component block:    c-{component-name}                      │
│  ├─ Element:            c-{component}__element                  │
│  └─ Modifier:           c-{component}--modifier                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 LWC Documentation Standards

```javascript
/**
 * @description Form renderer component for Gift Entry
 * Dynamically renders form fields based on template configuration
 *
 * @fires formsubmit - When form is submitted successfully
 * @fires formerror - When form submission fails
 *
 * @example
 * <c-ge-form-renderer
 *     template-id={templateId}
 *     record-id={recordId}
 *     onformsubmit={handleSubmit}>
 * </c-ge-form-renderer>
 */
import { LightningElement, api, wire } from 'lwc';

export default class GeFormRenderer extends LightningElement {
    /**
     * @description The template ID to render
     * @type {string}
     */
    @api templateId;

    /**
     * @description Optional record ID for editing existing records
     * @type {string}
     */
    @api recordId;

    /**
     * @description Whether the form is in read-only mode
     * @type {boolean}
     * @default false
     */
    @api readOnly = false;
```

---

## 3. Code Patterns

### 3.1 Service Layer Pattern

```apex
/**
 * @description Standard service layer pattern for NPSP
 */
public inherited sharing class Domain_FeatureService {

    // ============= SINGLETON (Optional) =============
    private static Domain_FeatureService instance;

    public static Domain_FeatureService getInstance() {
        if (instance == null) {
            instance = new Domain_FeatureService();
        }
        return instance;
    }

    // ============= PUBLIC API =============

    /**
     * @description Main entry point for feature
     */
    public List<Result> processRecords(List<SObject> records) {
        // Validate inputs
        validateInputs(records);

        // Execute business logic
        List<Result> results = executeLogic(records);

        // Return results
        return results;
    }

    // ============= PRIVATE METHODS =============

    private void validateInputs(List<SObject> records) {
        if (records == null || records.isEmpty()) {
            throw new Domain_Exception('Records cannot be null or empty');
        }
    }

    private List<Result> executeLogic(List<SObject> records) {
        // Implementation
    }

    // ============= INNER CLASSES =============

    public class Result {
        public Id recordId;
        public Boolean success;
        public String message;
    }

    public class Domain_Exception extends Exception {}
}
```

### 3.2 Selector Pattern

```apex
/**
 * @description Selector for Account queries
 * Encapsulates all SOQL for Account object
 */
public inherited sharing class AccountSelector {

    // ============= FIELD SETS =============

    private static final List<Schema.SObjectField> STANDARD_FIELDS =
        new List<Schema.SObjectField>{
            Account.Id,
            Account.Name,
            Account.Type,
            Account.BillingCity,
            Account.BillingState
        };

    // ============= QUERIES =============

    /**
     * @description Get accounts by IDs with standard fields
     */
    public List<Account> selectById(Set<Id> accountIds) {
        return selectById(accountIds, STANDARD_FIELDS);
    }

    /**
     * @description Get accounts by IDs with custom fields
     */
    public List<Account> selectById(
        Set<Id> accountIds,
        List<Schema.SObjectField> fields
    ) {
        if (accountIds == null || accountIds.isEmpty()) {
            return new List<Account>();
        }

        String fieldList = buildFieldList(fields);
        String query = 'SELECT ' + fieldList +
            ' FROM Account WHERE Id IN :accountIds';

        return Security.stripInaccessible(
            AccessType.READABLE,
            Database.query(query)
        ).getRecords();
    }

    /**
     * @description Get accounts by name search
     */
    public List<Account> selectByNameSearch(String searchTerm, Integer limitCount) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';

        return (List<Account>) Security.stripInaccessible(
            AccessType.READABLE,
            [SELECT Id, Name, Type
             FROM Account
             WHERE Name LIKE :searchPattern
             ORDER BY Name
             LIMIT :limitCount]
        ).getRecords();
    }

    // ============= HELPERS =============

    private String buildFieldList(List<Schema.SObjectField> fields) {
        List<String> fieldNames = new List<String>();
        for (Schema.SObjectField field : fields) {
            fieldNames.add(field.getDescribe().getName());
        }
        return String.join(fieldNames, ', ');
    }
}
```

### 3.3 Error Handling Pattern

```apex
/**
 * @description Standard error handling pattern
 */
public inherited sharing class ErrorHandlingExample {

    public void processWithErrorHandling(List<SObject> records) {
        Savepoint sp = Database.setSavepoint();

        try {
            // Business logic
            processRecords(records);

        } catch (DmlException dmlEx) {
            // Rollback on DML errors
            Database.rollback(sp);

            // Log detailed error
            ERR_Handler.processError(dmlEx, ERR_Handler_API.Context.NPSP);

            // Re-throw with user-friendly message
            throw new AuraHandledException(
                Label.errDmlFailed + ': ' + dmlEx.getDmlMessage(0)
            );

        } catch (NPSP_Exception npspEx) {
            // Known business exception - no rollback needed
            ERR_Handler.processError(npspEx, ERR_Handler_API.Context.NPSP);
            throw new AuraHandledException(npspEx.getMessage());

        } catch (Exception ex) {
            // Unexpected error - rollback and log
            Database.rollback(sp);
            ERR_Handler.processError(ex, ERR_Handler_API.Context.NPSP);

            // Don't expose internal error details
            throw new AuraHandledException(Label.errUnexpected);
        }
    }
}
```

---

## 4. Enforcement Mechanisms

### 4.1 PMD Rules Configuration

```xml
<!-- pmd-npsp-ruleset.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<ruleset name="NPSP Quality Rules"
         xmlns="http://pmd.sourceforge.net/ruleset/2.0.0">

    <description>Code quality rules for NPSP_nextgen</description>

    <!-- Apex Best Practices -->
    <rule ref="category/apex/bestpractices.xml">
        <exclude name="ApexUnitTestClassShouldHaveAsserts"/>
    </rule>

    <!-- Security Rules -->
    <rule ref="category/apex/security.xml"/>

    <!-- Performance Rules -->
    <rule ref="category/apex/performance.xml"/>

    <!-- Code Style -->
    <rule ref="category/apex/codestyle.xml">
        <exclude name="IfStmtsMustUseBraces"/>
    </rule>

    <!-- Design Rules -->
    <rule ref="category/apex/design.xml">
        <exclude name="AvoidDeeplyNestedIfStmts">
            <properties>
                <property name="problemDepth" value="4"/>
            </properties>
        </exclude>
    </rule>

    <!-- Custom Rules -->
    <rule name="NoHardcodedIds"
          language="apex"
          message="Avoid hardcoded Salesforce IDs"
          class="net.sourceforge.pmd.lang.apex.rule.ApexXPathRule">
        <properties>
            <property name="xpath">
                <value>
                    //LiteralExpression[matches(@Image, "^[a-zA-Z0-9]{15,18}$")]
                </value>
            </property>
        </properties>
    </rule>

</ruleset>
```

### 4.2 ESLint Configuration

```json
// .eslintrc.json
{
    "extends": [
        "@salesforce/eslint-config-lwc/recommended",
        "plugin:@lwc/eslint-plugin-lwc/recommended"
    ],
    "rules": {
        "@lwc/lwc/no-async-operation": "error",
        "@lwc/lwc/no-inner-html": "error",
        "@lwc/lwc/no-document-query": "error",
        "no-console": ["error", { "allow": ["warn", "error"] }],
        "no-unused-vars": "error",
        "prefer-const": "error",
        "no-var": "error",
        "eqeqeq": ["error", "always"],
        "curly": ["error", "all"],
        "max-lines-per-function": ["warn", { "max": 100 }],
        "complexity": ["warn", { "max": 15 }]
    },
    "overrides": [
        {
            "files": ["**/__tests__/**/*.js"],
            "rules": {
                "no-console": "off"
            }
        }
    ]
}
```

### 4.3 Pre-Commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: pmd-apex
        name: PMD Apex Analysis
        entry: pmd check -d force-app -R pmd-npsp-ruleset.xml -f text
        language: system
        files: \.cls$
        pass_filenames: false

      - id: eslint-lwc
        name: ESLint LWC
        entry: npm run lint:lwc
        language: system
        files: \.(js|html)$
        pass_filenames: false

      - id: apex-tests
        name: Validate Apex compiles
        entry: sf project deploy validate -d force-app
        language: system
        files: \.cls$
        pass_filenames: false
```

---

## 5. Code Review Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODE REVIEW CHECKLIST                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NAMING & STRUCTURE                                              │
│  □ Class/method names follow conventions                        │
│  □ Domain prefix used correctly                                 │
│  □ File organization matches standards                          │
│                                                                  │
│  DOCUMENTATION                                                   │
│  □ Class has @description header                                │
│  □ Public methods have ApexDoc/JSDoc                            │
│  □ Complex logic has inline comments                            │
│  □ No TODO/FIXME without issue reference                        │
│                                                                  │
│  CODE QUALITY                                                    │
│  □ No hardcoded IDs or credentials                              │
│  □ No SOQL/DML in loops                                         │
│  □ Proper error handling (no empty catches)                     │
│  □ Bulk-safe for 200+ records                                   │
│                                                                  │
│  SECURITY                                                        │
│  □ Explicit sharing declaration                                 │
│  □ CRUD/FLS checks where appropriate                            │
│  □ No SOQL injection vulnerabilities                            │
│  □ Input validation on controllers                              │
│                                                                  │
│  TESTING                                                         │
│  □ Test coverage ≥ 85%                                          │
│  □ Tests have assertions with messages                          │
│  □ Bulk tests included (200+ records)                           │
│  □ Negative test cases present                                  │
│                                                                  │
│  LWC SPECIFIC                                                    │
│  □ No @track on primitives                                      │
│  □ ARIA labels on interactive elements                          │
│  □ Error handling for wire/imperative calls                     │
│  □ Jest tests present                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| ApexDoc coverage | ~40% | 80%+ | Q2 2027 |
| JSDoc coverage | ~30% | 80%+ | Q2 2027 |
| PMD violations | Unknown | 0 critical | Q1 2027 |
| ESLint violations | Unknown | 0 errors | Q1 2027 |
| TODO/FIXME comments | 48 | 0 without issue | Q2 2027 |
| Test coverage | 85% | 90%+ | Q4 2027 |

---

## 7. Appendix

### A. ApexDoc Generation

```bash
# Generate ApexDoc documentation
java -jar apexdoc.jar \
    -s force-app/main/default/classes \
    -t docs/apex \
    -p global,public \
    -h docs/header.html
```

### B. Related Documents

- [02-SECURITY-ARCHITECTURE.md](02-SECURITY-ARCHITECTURE.md)
- [10-TESTING-STRATEGY.md](10-TESTING-STRATEGY.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
