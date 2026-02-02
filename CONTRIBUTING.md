# Contributing to NPSP_nextgen

Thank you for your interest in contributing to NPSP_nextgen! This community-driven fork of NPSP welcomes contributions from developers, admins, and nonprofit technology enthusiasts.

## Governance Model

### Community-Driven

NPSP_nextgen is a **community project** - not sponsored or maintained by Salesforce or Salesforce.org. Contributions are reviewed and merged by community maintainers.

**Key Principles:**
- Open contribution model
- Transparent decision-making
- Community consensus on major changes
- LLM-assisted review process

## How to Contribute

### Reporting Issues

Use our GitHub issue templates:

1. **Bug Reports**: For problems with existing functionality
2. **Feature Requests**: For new features or enhancements
3. **Security Reports**: For security vulnerabilities (non-sensitive details only)

Each issue is automatically triaged and routed to the appropriate domain agent for review.

### Submitting Code

#### Before You Start

1. **Check existing issues** - Someone may already be working on it
2. **Open an issue first** - Discuss significant changes before coding
3. **Read the architecture docs** - Understand the codebase patterns in `.claude/agents/`

#### Development Workflow

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/NPSP_nextgen.git
cd NPSP_nextgen

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Set up development environment
yarn install
pip install cumulusci

# 5. Create a scratch org for development
cci org scratch dev my_feature_org
cci flow run dev_org --org my_feature_org

# 6. Make your changes and test thoroughly

# 7. Run tests locally
npm run test:unit              # LWC tests
cci task run run_tests --org my_feature_org  # Apex tests

# 8. Commit with a descriptive message
git commit -m "Add feature: description of what and why"

# 9. Push and create a pull request
git push origin feature/your-feature-name
```

#### Pull Request Guidelines

- **One PR per feature/fix** - Keep PRs focused
- **Include tests** - All new code should have test coverage
- **Update documentation** - Update ApexDoc/JSDoc as needed
- **Follow code style** - Match existing patterns in the codebase
- **Test in scratch org** - Verify your changes work end-to-end

#### PR Checklist

- [ ] Code follows NPSP naming conventions (see `.claude/agents/domains/apex_agent.md`)
- [ ] All new Apex classes have ApexDoc headers
- [ ] All new LWC components have JSDoc comments
- [ ] Test coverage meets 85% minimum for Apex
- [ ] LWC components have Jest tests
- [ ] Security considerations addressed (sharing modes, CRUD/FLS)
- [ ] No hardcoded IDs or credentials
- [ ] Changes tested in scratch org

### Code Standards

#### Apex

- Use domain prefixes: `RD2_`, `CRLP_`, `BDI_`, `ALLO_`, `HH_`, etc.
- Prefer `inherited sharing` over `without sharing`
- Include CRUD/FLS checks for DML operations
- Use bind variables in SOQL (no string concatenation)
- Follow service/selector/domain layer patterns

#### Lightning Web Components

- Use camelCase naming: `geFormRenderer`, `rd2EntryForm`
- Include accessibility attributes (ARIA labels, keyboard nav)
- Use service singletons for shared state
- Avoid @track for primitive values (unnecessary in modern LWC)

#### Testing

- Use @TestSetup for shared test data
- Use builder patterns: `TEST_ContactBuilder`, `TEST_OpportunityBuilder`
- Include assertion messages: `System.assertEquals(expected, actual, 'Description')`
- Test bulk scenarios (200+ records) for trigger handlers

### Areas Needing Help

We particularly welcome contributions in:

1. **LWC Migration** - Converting Aura components to LWC
2. **Test Coverage** - Improving Apex and LWC test coverage
3. **Security** - Reviewing and fixing security issues
4. **Documentation** - Improving inline docs and user guides
5. **Accessibility** - Making components more accessible
6. **Performance** - Optimizing for large data volumes

## Code of Conduct

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, inclusive, and constructive.

## License

By contributing, you agree to license your contribution under the [BSD-3 Clause License](LICENSE).

## Questions?

- **Technical Questions**: Open a GitHub issue with the `question` label
- **Community Discussion**: [Nonprofit Hub](https://trailhead.salesforce.com/trailblazer-community/groups/0F9300000001ocxCAA)

---

Thank you for helping make NPSP_nextgen better for the nonprofit community!
