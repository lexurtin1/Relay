import type { SourceConnectorId } from "@/lib/knowledge-shared";

export type KnowledgeChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    id: string;
    connectorId: SourceConnectorId;
    title: string;
    snippet: string;
  }>;
};

export type KnowledgeChatThread = {
  id: string;
  title: string;
  messages: KnowledgeChatMessage[];
};

export const KNOWLEDGE_CHAT_THREADS: KnowledgeChatThread[] = [
  {
    id: "digital-ta",
    title: "Digital TA rollout status",
    messages: [
      {
        id: "digital-ta-u1",
        role: "user",
        content: "What stage is Digital TA at?",
      },
      {
        id: "digital-ta-a1",
        role: "assistant",
        content:
          "Digital TA is in active delivery. Jira shows the rollout epic in progress, with Confluence runbooks covering distributor cutover and Salesforce tracking pilot accounts.",
        citations: [
          {
            id: "jira-dta-1",
            connectorId: "jira",
            title: "DTA-120 Digital TA rollout epic",
            snippet: "Pilot distributors green; wave-2 cutover scheduled.",
          },
          {
            id: "conf-dta-1",
            connectorId: "confluence",
            title: "Digital TA cutover checklist",
            snippet: "Pre-flight checks for ISIN mapping and NAV windows.",
          },
        ],
      },
    ],
  },
  {
    id: "blackrock-billing",
    title: "BlackRock billing & renewals",
    messages: [
      {
        id: "br-u1",
        role: "user",
        content: "How are we charging BlackRock?",
      },
      {
        id: "br-a1",
        role: "assistant",
        content:
          "BlackRock is on a tiered message fee with a renewal clause in Salesforce. Power BI revenue dashboards show Q3 usage above the committed band.",
        citations: [
          {
            id: "sf-br-1",
            connectorId: "salesforce",
            title: "BlackRock opportunity renewal",
            snippet: "Enterprise messaging tier · renewal in 90 days.",
          },
          {
            id: "pbi-br-1",
            connectorId: "powerbi",
            title: "EMEA billing usage Q3",
            snippet: "BlackRock above committed volume band.",
          },
        ],
      },
    ],
  },
  {
    id: "lg-review",
    title: "L&G relationship review",
    messages: [
      {
        id: "lg-u1",
        role: "user",
        content: "Summarise the L&G relationship review.",
      },
      {
        id: "lg-a1",
        role: "assistant",
        content:
          "Legal & General sits in a healthy commercial posture. Open Jira items are mostly onboarding polish; Confluence holds the latest QBR notes.",
        citations: [
          {
            id: "conf-lg-1",
            connectorId: "confluence",
            title: "L&G QBR notes",
            snippet: "Retention strong; expand Digital TA discussion next quarter.",
          },
        ],
      },
    ],
  },
  {
    id: "etf-pipeline",
    title: "Q3 ETF pipeline weighting",
    messages: [
      {
        id: "etf-u1",
        role: "user",
        content: "Where is Q3 ETF pipeline weighted?",
      },
      {
        id: "etf-a1",
        role: "assistant",
        content:
          "Pipeline weight concentrates on EMEA ETF onboarding. Salesforce opportunities and Databricks funnel tables both point to mid-market distributors.",
        citations: [
          {
            id: "sf-etf-1",
            connectorId: "salesforce",
            title: "ETF pipeline board",
            snippet: "Weighted pipeline skewed to EMEA mid-market.",
          },
        ],
      },
    ],
  },
  {
    id: "thailand-network",
    title: "Thailand network pressures",
    messages: [
      {
        id: "th-u1",
        role: "user",
        content: "Any Thailand network pressures we should know about?",
      },
      {
        id: "th-a1",
        role: "assistant",
        content:
          "Ops flagged intermittent settlement latency. Jira has an open incident thread; Confluence runbooks cover the escalation path.",
        citations: [
          {
            id: "jira-th-1",
            connectorId: "jira",
            title: "TH-NET latency incident",
            snippet: "Monitoring elevated P95 on Thailand settlement hops.",
          },
        ],
      },
    ],
  },
];

export const KNOWLEDGE_SUGGESTED_PROMPTS = [
  {
    id: "stage-dta",
    label: "What stage is Digital TA at?",
    source: "jira" as SourceConnectorId,
  },
  {
    id: "charge-br",
    label: "How are we charging BlackRock?",
    source: "salesforce" as SourceConnectorId,
  },
];
