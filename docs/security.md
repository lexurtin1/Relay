# Security

## Data rules for this prototype

- **No production data in build environments.** Runners receive code, documentation, and synthetic data only.
- **Research connectors are read-only.** Agents may search and fetch documents; they must not write to Salesforce, Jira, Confluence, Power BI, Databricks, or GitHub from research tools.
- **Audit everything.** Model calls, connector item access, approvals, and hand-offs write `AuditLog` rows.
- **Mock mode is the default.** Live credentials must not be required to demonstrate the workflow.
- **Secrets stay in environment variables.** Never commit keys or tokens.

## Before any live SS&C use, confirm

1. Approved AI Gateway base URL, auth scheme, retention, and logging policy.
2. Which connector credentials Innovation and Strategy may use, and whether traffic must stay on the corporate network.
3. Whether Runner workspaces may open real GitHub pull requests or must stay on a sandbox org.
4. Retention period for prompts, findings, plans, and audit logs.
5. SSO / identity provider integration (this prototype uses a mock user switcher only).
6. Brand asset and colour usage against the official SS&C Calastone guidelines.
7. Data classification for any document an agent may retrieve once live connectors are enabled.
