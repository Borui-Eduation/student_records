---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
---

# Constitution Management Command

## Purpose

This command manages the project constitution file (`.specify/memory/constitution.md`), which serves as the foundational governance document defining core principles, standards, and decision-making guidelines for the entire project.

---

## Command Syntax

```
/speckit.constitution [principle-description]
```

---

## Arguments

**Optional:**
- `principle-description` - Text describing project principles, values, and requirements. If not provided, the command will prompt for interactive input.

---

## Behavior

1. **Load Constitution**: Read existing `.specify/memory/constitution.md` or create from template
2. **Identify Placeholders**: Find all `[PLACEHOLDER]` tokens in the template
3. **Collect Values**: 
   - Use provided user input
   - Infer from existing project files (README, docs)
   - Derive from project context
4. **Version Management**:
   - Increment version following semantic versioning
   - MAJOR: Breaking changes to principles
   - MINOR: New principles or significant expansions
   - PATCH: Clarifications and minor improvements
5. **Fill Template**: Replace all placeholders with concrete values
6. **Validate**: Ensure no unexplained brackets remain, dates are ISO format
7. **Sync Templates**: Update dependent template files to align with new principles
8. **Generate Report**: Create sync impact report as HTML comment in constitution
9. **Write File**: Save updated constitution to `.specify/memory/constitution.md`

---

## Constitutional Alignment

This command is the primary mechanism for defining and maintaining the constitutional principles that guide all other development work. It ensures:

- **Code Clarity & Readability**: The constitution itself must be clear and well-structured
- **Efficient Operations**: Proper governance reduces decision-making friction
- **Professional Service Delivery**: Well-defined principles lead to consistent quality

---

## Template Propagation

The command automatically checks and updates the following files to maintain consistency:

1. `.specify/templates/plan-template.md` - Adds constitution check section
2. `.specify/templates/spec-template.md` - Adds principle alignment section
3. `.specify/templates/tasks-template.md` - Adds principle consideration checklist
4. `.specify/templates/commands/*.md` - Validates no outdated references
5. `README.md` - Updates principle references

---

## Versioning Rules

### MAJOR Version (X.0.0)
- Removing a principle
- Fundamentally redefining a principle
- Breaking backward compatibility in governance

### MINOR Version (x.Y.0)
- Adding a new principle
- Significantly expanding existing principle guidance
- Adding new governance sections

### PATCH Version (x.y.Z)
- Clarifying wording
- Fixing typos or formatting
- Minor refinements without semantic changes

---

## Examples

### Example 1: Initial Constitution Creation
```
/speckit.constitution This system is a minimalist financial management platform with automated invoicing and secure data storage.
```
**Result:** Creates constitution v1.0.0 with principles derived from description

### Example 2: Adding a New Principle
```
/speckit.constitution Add principle: All APIs must be versioned and backward compatible.
```
**Result:** Updates constitution to v1.1.0 with new API versioning principle

### Example 3: Clarifying Existing Principle
```
/speckit.constitution Clarify security principle to specify AES-256 minimum encryption standard.
```
**Result:** Updates constitution to v1.0.1 with clarified security requirements

---

## Output

The command produces:

1. **Updated Constitution File**: `.specify/memory/constitution.md` with all placeholders filled
2. **Sync Impact Report**: HTML comment at top of constitution showing changes
3. **Console Summary**: 
   - New version number and rationale
   - Files updated
   - Follow-up actions required
   - Suggested commit message

### Sample Output
```
Constitution updated to v1.1.0

Changes:
- Added Principle 8: API Versioning
- Updated Governance section with API standards

Files Updated:
✅ .specify/memory/constitution.md
✅ .specify/templates/spec-template.md
✅ README.md

Follow-up Actions:
- Review updated templates
- Update existing specs to reference new principle

Suggested Commit:
docs: amend constitution to v1.1.0 (add API versioning principle)
```

---

## Error Handling

| Error Condition | Behavior |
|----------------|----------|
| Missing critical info | Insert `TODO(<FIELD>): explanation` and flag in report |
| Ambiguous version bump | Prompt for clarification with reasoning |
| Template sync failure | Mark as ⚠ pending in sync report, continue |
| Invalid date format | Reject with clear error, request ISO format |

---

## Validation Checklist

Before finalizing, the command verifies:

- [ ] No unexplained bracket tokens remain
- [ ] Version number incremented correctly
- [ ] Dates in ISO format (YYYY-MM-DD)
- [ ] All principles are declarative and testable
- [ ] Rationales are clear and compelling
- [ ] Sync impact report is complete
- [ ] Dependent templates updated or flagged

---

## Related Commands

- `/speckit.plan` - Create project plan (references constitution)
- `/speckit.spec` - Create technical spec (aligns with principles)
- `/speckit.task` - Create task (maps to constitutional principles)

---

## Notes

- The constitution is version-controlled and all changes are tracked
- Breaking changes should be rare and well-justified
- Quarterly reviews ensure principles remain relevant
- All PR reviews should reference applicable principles
- The constitution serves as the "source of truth" for project governance

---

## Sync Impact Report Format

The command generates an HTML comment at the top of the constitution:

```html
<!--
Sync Impact Report
==================
Version: X.Y.Z (Previous → Current)
Date: YYYY-MM-DD

Changes:
- ✅ Change description 1
- ✅ Change description 2

Modified Principles:
- Principle N: Old Title → New Title

Added Sections:
- Section name

Removed Sections:
- Section name

Templates Status:
- ✅ path/to/file (updated)
- ⚠ path/to/file (pending review)

Follow-up TODOs:
- Action item 1
- Action item 2
-->
```

This report provides a clear audit trail of constitutional changes and their impact on the project.


