# NPSP vs Nonprofit Cloud: A Comprehensive Primer

## The Complete Guide to Understanding the Gap, the Shift, and the Future

**Document Version:** 1.0
**Last Updated:** February 2026
**Purpose:** Strategic reference for organizations evaluating NPSP modernization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Strategic Landscape](#the-strategic-landscape)
3. [Data Model: The Fundamental Divide](#data-model-the-fundamental-divide)
4. [Feature Gap Analysis](#feature-gap-analysis)
5. [Why Salesforce Is Pushing Nonprofit Cloud](#why-salesforce-is-pushing-nonprofit-cloud)
6. [Why Organizations Are Migrating](#why-organizations-are-migrating)
7. [Why Organizations Stay on NPSP](#why-organizations-stay-on-npsp)
8. [The Migration Reality](#the-migration-reality)
9. [NPSP_nextgen: Filling the Gap](#npsp_nextgen-filling-the-gap)
10. [Decision Framework](#decision-framework)

---

## Executive Summary

The nonprofit Salesforce ecosystem is at a crossroads. In March 2023, Salesforce announced Nonprofit Cloud (NPC) as the successor to "practically everything that had come before it" — including the beloved Nonprofit Success Pack (NPSP) that has served over 35,000 organizations for more than a decade.

### The Bottom Line

| Aspect | NPSP | Nonprofit Cloud |
|--------|------|-----------------|
| **Status** | Maintenance mode (bug fixes only) | Active development |
| **New Features** | None since ~2020 | Quarterly releases |
| **Cost** | Free managed package | $60-100/user/month after 10 free |
| **AI/Agentforce** | Not available | Full access |
| **End of Life** | Not announced | N/A |
| **Best For** | Small-medium orgs, tight budgets | Large/growing orgs, advanced needs |

**Key Insight:** NPSP isn't dying tomorrow, but it's also not evolving. Organizations face a choice: migrate to NPC (expensive, complex), stay on NPSP (safe but stagnant), or modernize NPSP independently (the NPSP_nextgen approach).

---

## The Strategic Landscape

### Salesforce's Official Position

Salesforce has been carefully diplomatic about NPSP's future:

> "We will also continue to offer and support the licenses of customers who are already using the Power of Us program, and our existing paid nonprofit offerings and data models, such as the Nonprofit Success Pack (NPSP)."
> — Salesforce.org, March 2023

**Translation:** NPSP isn't being killed, but it's not being invested in either.

### Timeline of Key Events

| Date | Event | Impact |
|------|-------|--------|
| **2008** | NPSP launches | Revolutionizes nonprofit CRM |
| **2018** | Enhanced Recurring Donations | Last major NPSP feature |
| **2020** | Customizable Rollups | Final significant enhancement |
| **March 2023** | Nonprofit Cloud announced | NPSP enters maintenance mode |
| **October 2024** | Elevate shuts down | NPSP loses payment processing partner |
| **December 2025** | Workflow Rules/Process Builder EOL | Affects many NPSP customizations |
| **January 2026** | foundationConnect deactivated | Another ecosystem change |
| **2026+** | Agentforce Nonprofit launches | AI features exclusive to NPC |

### The Reality Check

- **No sunset date announced** for NPSP
- **Bug fixes continue** with bi-weekly releases
- **All innovation** goes exclusively to Nonprofit Cloud
- **Partner ecosystem** is shifting focus to NPC implementations
- **AppExchange vendors** increasingly prioritizing NPC compatibility

---

## Data Model: The Fundamental Divide

The most significant difference between NPSP and Nonprofit Cloud isn't a feature — it's the foundational architecture. Understanding this is critical to understanding everything else.

### The Individual: Contact vs Person Account

| NPSP | Nonprofit Cloud |
|------|-----------------|
| **Contact** record linked to **Household Account** | **Person Account** (hybrid Contact + Account) |
| Every Contact auto-creates a Household | Householding is optional |
| "Sam Supporter" + "Sam Supporter Household" (2 records) | "Sam Supporter" (1 record) |
| Works with any Salesforce org | Requires Person Accounts enabled (irreversible) |

**Why This Matters:**
- Person Accounts cannot be disabled once enabled
- Reporting, automation, and integrations work differently
- Migration requires fundamental data restructuring
- Some AppExchange apps don't support Person Accounts

### The Donation: Opportunity vs Gift Objects

**NPSP Model:**
```
Opportunity (Donation)
├── Payment__c (can have multiple)
└── Allocation__c (to GAUs)
```

**Nonprofit Cloud Model:**
```
Gift Commitment (Promise)
├── Gift Commitment Schedule (Recurring details)
└── Gift Transaction (Actual payment)
    ├── Gift Transaction Designation (Fund allocation)
    ├── Gift Tribute (Memorial/Honor)
    └── Gift Soft Credit (Attribution)
```

| Concept | NPSP | Nonprofit Cloud |
|---------|------|-----------------|
| One-time donation | Opportunity (Closed Won) | Gift Transaction |
| Recurring donation | Recurring Donation + Opportunities | Gift Commitment + Schedule + Transactions |
| Pledge | Opportunity (Pledged stage) | Gift Commitment |
| Major gift pipeline | Opportunity | Opportunity (kept for pipeline) |
| Fund allocation | GAU Allocation | Gift Transaction Designation |
| Soft credit | Partial Soft Credit + Account Soft Credit | Gift Soft Credit |
| Tribute/Memorial | Fields on Opportunity | Gift Tribute (separate object) |

**Critical Constraint:** Nonprofit Cloud does NOT accept $0 gift transactions. NPSP does.

### Relationships: Object Model Comparison

**NPSP:**
```
Contact ←→ Relationship__c ←→ Contact
Contact ←→ Affiliation__c ←→ Account (Organization)
```

**Nonprofit Cloud:**
```
Person Account ←→ Contact-Contact Relationship ←→ Person Account
Person Account ←→ Account-Contact Relationship ←→ Account
                  Party Relationship Group (PRG model)
                  Actionable Relationship Center (ARC visualization)
```

**Key Difference:** NPSP automatically creates reciprocal relationships. NPC does not — you must create both sides manually or via automation.

---

## Feature Gap Analysis

### Features NPC Has That NPSP Lacks

#### 1. Actionable Relationship Center (ARC)
Visual network graph showing all constituent relationships with ability to create/edit directly from the visualization. NPSP has a basic Relationship Viewer but nothing comparable.

#### 2. Program Management Module
Full program tracking including:
- Benefit Assignment
- Program Enrollment workflows
- Participant Profiles
- Session scheduling
- Bulk enrollment capabilities

NPSP has no native program management.

#### 3. Outcome Management
- Outcome Strategy definition with indicators
- Progress tracking against targets
- Assessment creation and management
- Impact measurement reporting

NPSP has no native outcome tracking.

#### 4. OmniStudio Tools
- **FlexCards**: Lightweight UI components for contextual data
- **OmniScripts**: Guided, branching workflows
- **Data Mapper**: Declarative data manipulation
- **Integration Procedures**: Server-side processes

NPSP uses traditional Visualforce/Aura/LWC.

#### 5. Business Rules Engine (BRE)
No-code decision automation with:
- Expression sets
- Decision matrices
- Decision tables

NPSP requires Apex or Flow for complex logic.

#### 6. Grantmaking Module
Complete grant lifecycle management:
- Application intake
- Review processes
- Award management
- Reporting requirements

NPSP has basic grant fields on Opportunity but no full module.

#### 7. AI/Agentforce Features (Exclusive to NPC)

| Feature | Availability | Description |
|---------|-------------|-------------|
| Major Donor Engagement Summaries | Beta Oct 2024 | AI-generated relationship summaries |
| Major Gift Proposals | Beta Oct 2024 | AI-assisted proposal generation |
| Program/Benefits Summaries | Beta Oct 2024 | Automated program documentation |
| Notes Summaries | Beta Oct 2024 | Meeting note synthesis |
| Prospect Research Agent | GA Now | Preps for funder meetings via Slack |
| Participant Management Agent | GA Now | Call note summaries for case managers |
| Donor Support Agent | Beta Spring 2025 | Self-service donor portal |
| Volunteer Capacity Agent | Beta | Workforce management |

**Pricing:** $2/conversation after 1,000 free conversations

#### 8. Native Volunteer Management
Coming Summer 2025, built directly into NPC at no additional cost. Includes self-service portal powered by Experience Cloud.

#### 9. Einstein Analytics Templates
Pre-built CRM Analytics dashboards for nonprofit KPIs, fundraising analytics, and program performance.

---

### Features NPSP Has That NPC Lacks (or Does Differently)

#### 1. Customizable Rollups (CRLP)
Powerful, flexible aggregation engine for calculating totals, counts, and statistics across related records. NPC's rollup capabilities are more limited (on roadmap).

**NPSP Advantage:** Define custom rollups without code.

#### 2. Address Management
NPSP has robust multi-address support:
- Seasonal addresses
- Address verification integration
- Automatic contact address updates when household changes
- Mailing preference tracking

**NPC Status:** Basic address support; advanced features on roadmap.

#### 3. Automatic Reciprocal Relationships
When you create a relationship in NPSP, the reciprocal is created automatically (John is Mary's spouse → Mary is John's spouse).

**NPC Behavior:** Manual creation required for both sides.

#### 4. $0 Gift Acceptance
NPSP accepts $0 donations (useful for in-kind gifts with no FMV, comped tickets, etc.).

**NPC Constraint:** Does not accept $0 gift transactions.

#### 5. Established Receipt Generation
NPSP has mature patterns for generating donation receipts.

**NPC Status:** More manual configuration required.

#### 6. Simpler Data Model
NPSP's Contact + Account model is familiar to all Salesforce users and works with any AppExchange app.

**NPC Reality:** Person Accounts have quirks and not all apps support them.

---

### Feature Parity Achieved (NPC Caught Up)

These features now exist in both platforms:

| Feature | NPSP | NPC Status |
|---------|------|------------|
| Batch Gift Entry | Yes | Yes (Gift Entry) |
| Recurring Donations | Enhanced RD | Gift Commitments + Schedules |
| Soft Credits | Yes | Yes (separate object) |
| Tributes/Memorials | Fields on Opportunity | Gift Tribute object |
| Engagement Plans | Yes | Campaign Flows |
| Levels | Yes | RFM Scoring (Spring '25) |
| Matching Gifts | Yes | Yes |
| Pledge Management | Yes | Gift Commitments |
| Duplicate Management | Yes | Yes |
| Data Import | BDI | Gift Entry + Data Loader |

---

## Why Salesforce Is Pushing Nonprofit Cloud

### 1. Industry Cloud Strategy

Salesforce has reorganized around Industry Clouds — vertical-specific platforms sharing common architecture:
- Health Cloud
- Financial Services Cloud
- Education Cloud
- Public Sector Cloud
- **Nonprofit Cloud**

This allows cross-pollination of features. A grantmaking feature from Public Sector can flow to Nonprofit Cloud. NPSP, as a managed package, cannot benefit from this.

### 2. Platform Economics

| Aspect | NPSP | Nonprofit Cloud |
|--------|------|-----------------|
| License Revenue | $0 (free package) | $60-100/user/month |
| Support Model | Community + package maintainers | Full Salesforce support |
| Implementation Revenue | Partners | Partners + Salesforce PS |
| AI/Agentforce Revenue | $0 | $2/conversation |

**The math is clear:** Nonprofit Cloud generates significantly more revenue per customer.

### 3. AI Requires Modern Architecture

Agentforce and Einstein features require:
- Data Cloud integration
- Modern object structures
- Platform Events architecture
- OmniStudio capabilities

NPSP's managed package architecture cannot support these requirements.

### 4. Managed Package Limitations

NPSP as a managed package faces inherent constraints:
- Cannot use certain platform features
- Namespace restrictions
- Upgrade complexity
- Limited Salesforce support (it's technically third-party code)

Nonprofit Cloud as native platform gets:
- Full Salesforce support
- Immediate access to new platform features
- No namespace complications
- Direct integration with other clouds

### 5. Competitive Positioning

The nonprofit CRM market has evolved:
- **Blackbaud** offers integrated suites
- **Bloomerang** focuses on simplicity
- **Virtuous** emphasizes AI-driven insights
- **HubSpot** entered nonprofit space

Salesforce needs a modern, feature-rich offering to compete — not a 15-year-old managed package.

### 6. Partner Ecosystem Realignment

Salesforce.org eliminated its vetted consulting partner network in 2024. The message to partners: invest in Nonprofit Cloud expertise, not NPSP maintenance.

---

## Why Organizations Are Migrating

### 1. Technical Debt Accumulation

> "Years of accumulated custom code, batch processes, and limited documentation had significantly increased technical debt."
> — American Association for Cancer Research (migrated to NPC)

Organizations with heavily customized NPSP instances face:
- Fragile integrations that "fail silently"
- Custom code nobody understands
- Upgrade anxiety
- Consultant dependency

NPC migration offers a "clean slate" opportunity.

### 2. Integration Fragility

Common pain point:
> "Rapid integrations with online donations, accounting, telephony, or events turn into fragile dependencies that fail silently until they turn into missed opportunities."

The promise of NPC's modern architecture: more stable, maintainable integrations.

### 3. Data Quality Crisis

Industry statistics suggest:
- ~8% duplicate rate in typical nonprofit databases
- 50,000 contacts = ~4,000 redundant entries
- Aging addresses, lost preferences, incomplete records

Migration forces data cleanup that organizations have been avoiding.

### 4. Advanced Capability Needs

Organizations migrate when they need:
- **Multi-program tracking** with outcome measurement
- **AI-powered insights** for donor engagement
- **Sophisticated case management** for services
- **Advanced analytics** beyond standard reports
- **OmniStudio workflows** for complex processes

### 5. Executive Mandate

Sometimes migration is driven by:
- Board pressure to "modernize"
- New leadership wanting fresh start
- Merger/acquisition requiring platform consolidation
- Grant requirements for specific capabilities

### 6. Fear of Being Left Behind

> "All new nonprofit customers will be implemented on NPC, not NPSP. As more organizations move to NPC, vendors will decide whether to continue NPSP support."

Organizations worry about:
- Shrinking NPSP ecosystem
- Harder to find NPSP consultants
- AppExchange apps dropping NPSP support

---

## Why Organizations Stay on NPSP

### 1. Cost Sensitivity

| Scenario | NPSP | Nonprofit Cloud |
|----------|------|-----------------|
| 10 users | $0/year | $0/year (Power of Us) |
| 25 users | $0/year | $10,800/year |
| 50 users | $0/year | $28,800/year |
| 100 users | $0/year | $64,800/year |

**Plus implementation costs:**
- NPC migration: $7,000-$30,000+
- Timeline: 3-6+ months
- Staff time for training and testing

For budget-constrained nonprofits, these numbers are prohibitive.

### 2. "If It Ain't Broke..."

Many organizations have stable, working NPSP implementations:
- Staff know the system
- Processes are established
- Integrations work
- Reports meet needs

The risk/disruption of migration outweighs perceived benefits.

### 3. Missing Features in NPC

Organizations dependent on these stay on NPSP:
- **Robust address management** (seasonal addresses, verification)
- **Customizable Rollups** for complex aggregations
- **$0 gift acceptance** for in-kind tracking
- **Automatic reciprocal relationships**
- **Specific AppExchange integrations** not yet NPC-compatible

### 4. Recent NPSP Investment

> "Many nonprofits recently migrated to NPSP after the January 2023 retirement of NGO Connect and are unlikely to migrate again soon."

Organizations that just implemented NPSP aren't ready for another major project.

### 5. Resource Constraints

Migration requires:
- Dedicated project manager
- Technical resources for data migration
- Staff time for UAT and training
- Budget for implementation partner
- Organizational change management capacity

Many nonprofits lack these resources.

### 6. Integration Complexity

Organizations heavily invested in NPSP-specific integrations face:
- Payment processor rebuilds
- Marketing automation reconfiguration
- Custom integration rewrites
- AppExchange app replacements

The more integrated, the harder to migrate.

### 7. Person Account Concerns

Person Accounts are controversial:
- Cannot be disabled once enabled
- Some AppExchange apps don't support them
- Reporting works differently
- Automation patterns change
- Some admins simply don't like them

### 8. No Deadline Pressure

> "NPSP remains supported with no immediate end-of-life."

Without a forcing function, inertia wins. Organizations can wait and see.

### 9. Complexity Avoidance

> "Switching from NPSP to NPC isn't just a simple update: you're essentially starting fresh in a new Salesforce org."

This reality deters many organizations.

### 10. AppExchange Ecosystem

Organizations using NPSP-specific apps face uncertainty:
- Will vendors support NPC?
- When will NPC versions be ready?
- Will feature parity exist?
- What's the transition path?

---

## The Migration Reality

### It's Not an Upgrade — It's a Re-Implementation

Critical understanding:
- **New Salesforce org required** (in most cases)
- **Complete data migration** with transformation
- **All automation rebuilt** from scratch
- **Integrations reconnected** to new objects
- **Staff retrained** on new workflows
- **Reports recreated** for new data model

### Typical Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Discovery & Planning | 4-6 weeks | Requirements, data audit, integration inventory |
| Data Migration Prep | 4-6 weeks | Cleanup, deduplication, mapping |
| Configuration | 6-10 weeks | Objects, automation, security |
| Data Migration | 2-4 weeks | ETL, validation, reconciliation |
| Integration | 4-8 weeks | Reconnect all systems |
| UAT & Training | 4-6 weeks | Testing, staff preparation |
| Go-Live & Support | 2-4 weeks | Cutover, stabilization |
| **Total** | **6-12 months** | Varies by complexity |

### Typical Costs

| Component | Range |
|-----------|-------|
| Implementation Partner | $7,000-$30,000+ |
| Data Migration Tools | $0-$5,000 |
| Staff Time (opportunity cost) | Significant |
| Training | $1,000-$5,000 |
| Integration Updates | Variable |
| **Total** | **$10,000-$50,000+** |

### Common Migration Pitfalls

1. **"Lift and Shift" Mentality**
   Don't recreate NPSP in NPC. Redesign for the new paradigm.

2. **Underestimating Person Accounts**
   They work differently. Automation and reporting need rethinking.

3. **Data Migration Complexity**
   - ID crosswalks required
   - Relationships must be rebuilt
   - Historical data transformation is complex

4. **Permission Model Changes**
   NPC uses Permission Set Licenses (PSL) model, not profiles. Muted permissions don't transfer from sandbox to production.

5. **Feature Gaps Discovered Late**
   Test thoroughly for your specific needs before committing.

6. **Integration Breakage**
   Every integration must be rebuilt and tested.

7. **Change Management Underinvestment**
   Staff resistance and confusion derails projects.

### Success Factors

Organizations that migrate successfully:
- Have executive sponsorship and clear "why"
- Invest in proper change management
- Use experienced implementation partners
- Allow adequate timeline (don't rush)
- Clean data before migrating
- Test extensively before go-live
- Plan for post-go-live support

---

## NPSP_nextgen: Filling the Gap

### The Third Path

For organizations that:
- Cannot afford NPC migration
- Don't want to lose NPSP's simplicity
- Need modernization without disruption
- Want community-driven development

**NPSP_nextgen** offers an alternative: modernize NPSP itself.

### What NPSP_nextgen Aims to Provide

#### Immediate Value
- Security vulnerability fixes
- Performance optimizations
- Bug fixes Salesforce deprioritized
- API version updates

#### Platform Modernization
- Aura → LWC component migration
- Visualforce → LWC migration
- Modern Apex patterns (User Mode, null-safe operators)
- sf CLI compatibility

#### Feature Enhancement (Potential)
- Enhanced relationship visualization (ARC-like)
- Basic outcome tracking
- Improved Gift Entry experience
- Better mobile support

### What NPSP_nextgen Cannot Provide

- Agentforce/Einstein AI (platform limitation)
- OmniStudio capabilities (requires license)
- Full Industry Cloud features
- Salesforce official support
- Seamless Data Cloud integration

### The Value Proposition

| Need | NPC | NPSP | NPSP_nextgen |
|------|-----|------|--------------|
| Modern code standards | Yes | No | **Yes** |
| AI features | Yes | No | No |
| No additional cost | No | Yes | **Yes** |
| Familiar data model | No | Yes | **Yes** |
| Active development | Yes | No | **Yes** |
| Official Salesforce support | Yes | Limited | No |
| Community-driven | No | No | **Yes** |

---

## Decision Framework

### When to Migrate to Nonprofit Cloud

**Strong indicators:**
- [ ] Budget for $60+/user/month licensing
- [ ] Budget for $10,000-$50,000 implementation
- [ ] 6-12 months available for project
- [ ] Executive sponsorship secured
- [ ] Need AI/Agentforce capabilities
- [ ] Need advanced program management
- [ ] Need grantmaking module
- [ ] Current NPSP heavily customized/problematic
- [ ] Starting fresh anyway (new org, merger, etc.)

**Score: 7+ checks = Strong NPC candidate**

### When to Stay on NPSP

**Strong indicators:**
- [ ] Budget constraints (can't afford NPC licensing)
- [ ] Current NPSP working well
- [ ] Staff trained and productive
- [ ] Key integrations NPSP-dependent
- [ ] Recently implemented NPSP
- [ ] Small team (under 15 users)
- [ ] Primarily need fundraising (not programs)
- [ ] Risk-averse organization
- [ ] No resources for major project

**Score: 6+ checks = Stay on NPSP**

### When to Consider NPSP_nextgen

**Strong indicators:**
- [ ] Want to stay on NPSP but need modernization
- [ ] Concerned about NPSP stagnation
- [ ] Technical team can manage community package
- [ ] Want modern code standards
- [ ] Don't need AI features immediately
- [ ] Value community-driven development
- [ ] Budget-constrained but need improvements

### The Hybrid Approach

Some organizations:
1. **Stay on NPSP** for core fundraising
2. **Add standalone NPC modules** for programs/grants (separate implementation)
3. **Use NPSP_nextgen** for modernization benefits
4. **Plan NPC migration** for future (2-3 year horizon)

---

## Appendix A: Feature-by-Feature Comparison Matrix

| Feature | NPSP | NPC | NPSP_nextgen Target |
|---------|------|-----|---------------------|
| **Constituent Management** |
| Contact Records | Yes | Person Accounts | Yes (Contacts) |
| Household Management | Automatic | Optional Party Groups | Yes |
| Relationships | Yes + Reciprocal | Yes (manual) | Yes + Reciprocal |
| Affiliations | Yes | Account-Contact Rel | Yes |
| Relationship Visualization | Basic | ARC | Enhanced |
| **Fundraising** |
| One-time Gifts | Opportunity | Gift Transaction | Opportunity |
| Recurring Donations | Enhanced RD | Gift Commitment + Schedule | Enhanced RD |
| Pledges | Opportunity | Gift Commitment | Opportunity |
| Batch Gift Entry | BDI + Gift Entry | Gift Entry | Gift Entry (LWC) |
| Soft Credits | Yes | Yes (separate obj) | Yes |
| Tributes | Opp Fields | Gift Tribute obj | Opp Fields |
| GAU/Fund Allocation | GAU Allocation | Gift Designation | GAU Allocation |
| Matching Gifts | Yes | Yes | Yes |
| Customizable Rollups | CRLP | Limited (roadmap) | CRLP |
| $0 Gifts | Yes | No | Yes |
| **Programs** |
| Program Management | No | Yes | Basic (potential) |
| Outcome Tracking | No | Yes | Basic (potential) |
| Case Management | No | Yes | No |
| **Grants** |
| Grantmaking | Basic | Full Module | Basic |
| **Volunteers** |
| Volunteer Management | V4S (separate) | Native (Summer '25) | V4S |
| **Technology** |
| API Version | 53.0 | Current | Current |
| LWC Components | Mixed Aura/LWC | LWC | LWC (migrated) |
| Mobile Ready | Limited | Yes | Improved |
| AI/Agentforce | No | Yes | No |
| OmniStudio | No | Yes | No |
| **Cost** |
| Package | Free | N/A (native) | Free |
| Licensing | P10 free | P10 free + $60/user | P10 free |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **NPSP** | Nonprofit Success Pack - free managed package for Salesforce |
| **NPC** | Nonprofit Cloud - Salesforce's Industry Cloud for nonprofits |
| **Person Account** | Salesforce record type combining Contact and Account |
| **Gift Commitment** | NPC object for pledges and recurring donation promises |
| **Gift Transaction** | NPC object for actual payments received |
| **GAU** | General Accounting Unit - NPSP fund tracking |
| **CRLP** | Customizable Rollups - NPSP aggregation engine |
| **ARC** | Actionable Relationship Center - NPC relationship visualization |
| **BDI** | Batch Data Import - NPSP data loading tool |
| **TDTM** | Table-Driven Trigger Management - NPSP trigger framework |
| **P10** | Power of Us 10 free licenses program |
| **PSL** | Permission Set License - NPC access model |

---

## Appendix C: Resources

### Official Salesforce Resources
- [Nonprofit Cloud Documentation](https://help.salesforce.com/s/articleView?id=sfdo.Nonprofit_Cloud.htm)
- [NPSP Documentation](https://help.salesforce.com/s/articleView?id=sfdo.Nonprofit_Success_Pack.htm)
- [Power of Us Program](https://www.salesforce.org/power-of-us/)
- [Nonprofit Cloud Pricing](https://www.salesforce.com/nonprofit/pricing/)

### Community Resources
- [Trailblazer Community - Nonprofits](https://trailhead.salesforce.com/trailblazer-community/groups/0F9300000001ocxCAA)
- [NPSP GitHub Repository](https://github.com/SalesforceFoundation/NPSP)
- [NPSP_nextgen Repository](https://github.com/tbcolby/NPSP_nextgen)

### Analyst & Consultant Perspectives
- [Salesforce Ben - NPC vs NPSP](https://www.salesforceben.com/salesforce-nonprofit-cloud-vs-npsp-what-you-need-to-know/)
- [Fionta - Migration Guide](https://fionta.com/insights/transition-from-npsp-to-nonprofit-cloud/)
- [Cloud for Good - Migration Considerations](https://cloud4good.com/announcements/considerations-for-migrating-from-npsp-to-salesforce-nonprofit-cloud/)

---

**Document Maintainer:** NPSP_nextgen Community
**Feedback:** Submit issues at [github.com/tbcolby/NPSP_nextgen/issues](https://github.com/tbcolby/NPSP_nextgen/issues)
