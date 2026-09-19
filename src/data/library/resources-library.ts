import { DestinationGraph, Gap } from "@/domain/types";

export type ResourceFormat =
  | "project-guide"
  | "interactive-drill"
  | "case-study"
  | "documentation"
  | "article";

export interface CuratedResource {
  id: string;
  title: string;
  provider: string;
  format: ResourceFormat;
  targetGapCapabilityId: string;
  targetGapCapabilityName: string;
  learningObjective: string;
  whyThisResource: string;
  estimatedMinutes: number;
  url: string;
}

export interface GroupedGapResources {
  gapCapabilityId: string;
  gapCapabilityName: string;
  gapPriority: string;
  gapReason: string;
  resources: CuratedResource[];
}

export const SEEDED_RESOURCES_CATALOG: CuratedResource[] = [
  // Linear Algebra Gaps
  {
    id: "res-linalg-1",
    title: "Linear Algebra Review and Reference",
    provider: "Stanford CS229",
    format: "project-guide",
    targetGapCapabilityId: "cap-linalg",
    targetGapCapabilityName: "Linear Algebra",
    learningObjective:
      "Understand geometric intuitions behind dot products, matrix projections, and eigenvalue decomposition in neural networks.",
    whyThisResource:
      "Tied directly to your Linear Algebra repair action. Focuses strictly on the math applied in deep learning without abstract proofs.",
    estimatedMinutes: 60,
    url: "https://cs229.stanford.edu/section/cs229-linalg.pdf",
  },
  {
    id: "res-linalg-2",
    title: "Broadcasting",
    provider: "NumPy",
    format: "interactive-drill",
    targetGapCapabilityId: "cap-linalg",
    targetGapCapabilityName: "Linear Algebra",
    learningObjective:
      "Eliminate manual loops by expressing multi-dimensional transformations as vectorized broadcast operations.",
    whyThisResource:
      "Provides hands-on drills required to pass the matrix operations verification check.",
    estimatedMinutes: 45,
    url: "https://numpy.org/doc/stable/user/basics.broadcasting.html",
  },

  // Machine Learning Evaluation Gaps
  {
    id: "res-ml-eval-1",
    title: "Classification: Accuracy, recall, precision, and related metrics",
    provider: "Google Machine Learning Crash Course",
    format: "case-study",
    targetGapCapabilityId: "cap-ml",
    targetGapCapabilityName: "Machine Learning & Model Evaluation",
    learningObjective:
      "Master the accuracy paradox, threshold calibration, and Precision-Recall Area Under Curve (PR-AUC).",
    whyThisResource:
      "Addresses your evaluated deficit on the 99.2% accuracy paradox scenario, preparing you for the re-verification task.",
    estimatedMinutes: 50,
    url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",
  },
  {
    id: "res-ml-eval-2",
    title: "Cross-validation: evaluating estimator performance",
    provider: "scikit-learn",
    format: "documentation",
    targetGapCapabilityId: "cap-ml",
    targetGapCapabilityName: "Machine Learning & Model Evaluation",
    learningObjective:
      "Implement leak-free validation splits preserving target class distributions across test folds.",
    whyThisResource:
      "Direct technical guide for the validation strategy required by your upcoming verification milestone.",
    estimatedMinutes: 35,
    url: "https://scikit-learn.org/stable/modules/cross_validation.html",
  },

  // Deployment Gaps
  {
    id: "res-deploy-1",
    title: "FastAPI Tutorial",
    provider: "FastAPI",
    format: "project-guide",
    targetGapCapabilityId: "cap-deployment",
    targetGapCapabilityName: "Model Deployment & Serving",
    learningObjective:
      "Package inference logic in asynchronous endpoints with strict Pydantic input schemas and error handling.",
    whyThisResource:
      "Prerequisite reference guide for building your Deployable ML API portfolio project.",
    estimatedMinutes: 75,
    url: "https://fastapi.tiangolo.com/tutorial/",
  },

  // SQL Gaps
  {
    id: "res-sql-1",
    title: "Window Functions",
    provider: "PostgreSQL Documentation",
    format: "interactive-drill",
    targetGapCapabilityId: "cap-sql",
    targetGapCapabilityName: "SQL & Relational Databases",
    learningObjective:
      "Write advanced queries using ROW_NUMBER(), DENSE_RANK(), and PARTITION BY for multi-tenant event filtering.",
    whyThisResource:
      "Directly prepares you for the SQL scenario assessment in your verification queue.",
    estimatedMinutes: 40,
    url: "https://www.postgresql.org/docs/current/tutorial-window.html",
  },

  // Finance Gaps
  {
    id: "res-fin-dcf-1",
    title: "DCF Model Training Free Guide",
    provider: "Corporate Finance Institute (CFI)",
    format: "project-guide",
    targetGapCapabilityId: "cap-fin-modeling",
    targetGapCapabilityName: "Financial Modeling & Valuation",
    learningObjective:
      "Link balance sheet working capital schedules to operating cash flows and project terminal values with sensitivity tables.",
    whyThisResource:
      "Tied directly to your DCF modeling deliverable. Focuses on balance sheet integrity without plugs.",
    estimatedMinutes: 90,
    url: "https://corporatefinanceinstitute.com/resources/financial-modeling/dcf-model-training-free-guide/",
  },
  {
    id: "res-fin-accounting-1",
    title: "How to Read a 10-K",
    provider: "Investor.gov",
    format: "case-study",
    targetGapCapabilityId: "cap-fin-accounting",
    targetGapCapabilityName: "Accounting Principles",
    learningObjective:
      "Adjust operating profit for one-off charges and reconcile cash flow from operations with net income.",
    whyThisResource:
      "Provides the conceptual foundation for your 10-K forensic audit proof task.",
    estimatedMinutes: 60,
    url: "https://www.investor.gov/introduction-investing/getting-started/researching-investments/how-read-10-k",
  },
];

/**
 * Reusable domain selector: groups curated learning resources strictly by active gaps.
 * Resources serve already-decided objectives and never dictate the learner's path.
 */
export function matchResourcesToGaps(
  gaps: Gap[],
  graph: DestinationGraph
): GroupedGapResources[] {
  const result: GroupedGapResources[] = [];

  for (const gap of gaps) {
    const node = graph.capabilityNodes.find((n) => n.id === gap.capabilityId);
    const capName = node?.name ?? gap.capabilityId;

    const matching = SEEDED_RESOURCES_CATALOG.filter(
      (resource) => resource.targetGapCapabilityId === gap.capabilityId
    );

    result.push({
      gapCapabilityId: gap.capabilityId,
      gapCapabilityName: capName,
      gapPriority: gap.priority,
      gapReason: gap.reason,
      resources: matching,
    });
  }

  return result;
}
