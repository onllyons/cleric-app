// src/scripts/fitAssessment.ts
export type QuizSelections = {
  communication: string; // "slack" | "teams" | ""
  logs: string[];
  infrastructure: string[];
  code: string[];
  metrics: string[];
};

export type Capability = {
  type: "communication" | "logs" | "metrics" | "infrastructure" | "code";
  enabled: boolean;
  label: string;
  description: string;
};

export type FitLevel = "initial" | "poor" | "minimal" | "good" | "excellent";

export type FitAssessment = {
  level: FitLevel;
  title: string;
  description: string;
  capabilities: Capability[];
  canContinue: boolean;
  enabledCount: number;
  totalCount: number;
};

export function computeFitAssessment(s: QuizSelections): FitAssessment {
  const hasAny =
    !!s.communication ||
    s.logs.length > 0 ||
    s.infrastructure.length > 0 ||
    s.code.length > 0 ||
    s.metrics.length > 0;

  if (!hasAny) {
    return {
      level: "initial",
      title: "Select your stack",
      description: "See what Cleric can do for you",
      capabilities: [
        { type: "communication", enabled: false, label: "Auto-receive alerts via Slack", description: "Cleric joins your Slack channels to receive alerts and respond with investigations automatically" },
        { type: "logs", enabled: false, label: "Search logs and trace errors", description: "Query log systems to find error patterns, trace request flows, and identify root causes across distributed services" },
        { type: "metrics", enabled: false, label: "Query metrics and detect anomalies", description: "Analyze time-series data to identify performance degradations, resource bottlenecks, and abnormal patterns" },
        { type: "infrastructure", enabled: false, label: "Debug infrastructure state", description: "Run kubectl, AWS CLI, and other cloud tools to inspect pods, containers, deployments, and cloud resources during investigations" },
        { type: "code", enabled: false, label: "Analyze code, deployments, and CI/CD", description: "Review recent code changes, examine deployment history, check CI/CD logs, and suggest code fixes based on error patterns" },
      ],
      canContinue: false,
      enabledCount: 0,
      totalCount: 5,
    };
  }

  const isSlack = s.communication === "slack";
  const commEnabled = !!s.communication;
  const logsEnabled = s.logs.length > 0;
  const metricsEnabled = s.metrics.length > 0;
  const infraEnabled = s.infrastructure.length > 0;
  const codeEnabled = s.code.length > 0 && !s.code.includes("no-code");

  const capabilities: Capability[] = [
    {
      type: "communication",
      enabled: commEnabled,
      label: isSlack ? "Auto-receive alerts via Slack" : "Manual investigations via web UI",
      description: isSlack
        ? "Cleric joins your Slack channels to receive alerts and respond with investigations automatically"
        : "Manually trigger investigations through the web interface when issues arise",
    },
    {
      type: "logs",
      enabled: logsEnabled,
      label: "Search logs and trace errors",
      description:
        "Query log systems to find error patterns, trace request flows, and identify root causes across distributed services",
    },
    {
      type: "metrics",
      enabled: metricsEnabled,
      label: "Query metrics and detect anomalies",
      description:
        "Analyze time-series data to identify performance degradations, resource bottlenecks, and abnormal patterns",
    },
    {
      type: "infrastructure",
      enabled: infraEnabled,
      label: "Debug infrastructure state",
      description:
        "Run kubectl, AWS CLI, and other cloud tools to inspect pods, containers, deployments, and cloud resources during investigations",
    },
    {
      type: "code",
      enabled: codeEnabled,
      label: "Analyze code, deployments, and CI/CD",
      description:
        "Review recent code changes, examine deployment history, check CI/CD logs, and suggest code fixes based on error patterns",
    },
  ];

  const enabledCount = capabilities.filter((c) => c.enabled).length;
  const totalCount = capabilities.length;

  if (enabledCount <= 1) {
    return {
      level: "poor",
      title: "Insufficient stack coverage",
      description: "Requires logs or metrics integration",
      capabilities,
      canContinue: false,
      enabledCount,
      totalCount,
    };
  }

  if (enabledCount === 2) {
    return {
      level: "minimal",
      title: "Basic coverage",
      description: "2/5 capabilities enabled",
      capabilities,
      canContinue: true,
      enabledCount,
      totalCount,
    };
  }

  if (enabledCount >= 3 && enabledCount <= 4) {
    return {
      level: "good",
      title: "Good coverage",
      description: `${enabledCount}/5 capabilities enabled`,
      capabilities,
      canContinue: true,
      enabledCount,
      totalCount,
    };
  }

  return {
    level: "excellent",
    title: "Complete coverage",
    description: "5/5 capabilities enabled",
    capabilities,
    canContinue: true,
    enabledCount,
    totalCount,
  };
}
