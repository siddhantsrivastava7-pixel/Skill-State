import { DestinationGraph, Gap } from "@/domain/types";

export interface ProofProjectRecommendation {
  id: string;
  title: string;
  tagline: string;
  destinationFamily: string;
  targetCapabilityIds: string[];
  targetCapabilityNames: string[];
  proofLevel: "basic" | "working" | "production";
  whyThisProject: string;
  deliverables: string[];
  verificationCriteria: string[];
  estimatedHours: number;
}

export const SEEDED_PROJECTS_CATALOG: ProofProjectRecommendation[] = [
  // AI / ML Proof Projects
  {
    id: "proj-ml-eval-benchmark",
    title: "Production ML Benchmark & Evaluation Suite",
    tagline: "Rigorous cross-validation, threshold tuning, and error diagnosis on imbalanced data.",
    destinationFamily: "AI / Machine Learning",
    targetCapabilityIds: ["cap-ml", "cap-stats"],
    targetCapabilityNames: ["Machine Learning & Model Evaluation", "Probability & Statistics"],
    proofLevel: "working",
    whyThisProject:
      "Chosen specifically to prove Machine Learning evaluation rigor, replacing self-reported course claims with verifiable metric analysis.",
    deliverables: [
      "Precision-Recall AUC curve visualization across 5 stratified splits",
      "Threshold optimization matrix based on asymmetric cost penalty",
      "Reproducible Jupyter notebook with error distribution diagnostics",
    ],
    verificationCriteria: [
      "No reliance on accuracy alone for imbalanced splits",
      "Clear explanation of precision-recall tradeoffs",
      "Executable validation pipeline with seed reproducibility",
    ],
    estimatedHours: 25,
  },
  {
    id: "proj-docker-inference-api",
    title: "Deployable ML Inference REST API with FastAPI & Docker",
    tagline: "Containerized model serving with latency monitoring and OpenAPI specs.",
    destinationFamily: "AI / Machine Learning",
    targetCapabilityIds: ["cap-deployment", "cap-python"],
    targetCapabilityNames: ["Model Deployment & Serving", "Python Programming"],
    proofLevel: "production",
    whyThisProject:
      "Chosen to bridge your critical deployment gap, giving you a production-grade portfolio artifact required for AI Engineer internships.",
    deliverables: [
      "FastAPI service with batch prediction endpoint and Pydantic validation",
      "Multi-stage Dockerfile optimized for minimal image size (<400MB)",
      "Automated pytest test suite covering edge-case payloads and timeouts",
      "Swagger UI interactive documentation",
    ],
    verificationCriteria: [
      "Docker container builds and boots with zero runtime errors",
      "Response p95 latency under 120ms under test load",
      "Input validation rejects malformed JSON with HTTP 422",
    ],
    estimatedHours: 35,
  },
  {
    id: "proj-matrix-neural-refresher",
    title: "From-Scratch Neural Vectorization & Matrix Operations",
    tagline: "Pure NumPy implementation of forward and backprop matrix calculus.",
    destinationFamily: "AI / Machine Learning",
    targetCapabilityIds: ["cap-linalg", "cap-python"],
    targetCapabilityNames: ["Linear Algebra", "Python Programming"],
    proofLevel: "working",
    whyThisProject:
      "Chosen to cement linear algebra foundations into executable code, eliminating theoretical confusion before advanced model work.",
    deliverables: [
      "Vectorized dense layer and activation implementations without autograd",
      "Gradient checking script verifying analytical vs numerical derivatives",
      "Dimensionality transformation sanity checks across tensor shapes",
    ],
    verificationCriteria: [
      "Zero loops over batch samples in forward/backward matrix multiplies",
      "Gradient difference below 1e-6 in gradient checks",
    ],
    estimatedHours: 20,
  },

  // Data Engineering Projects
  {
    id: "proj-data-pipeline-elt",
    title: "Automated ELT Pipeline with DuckDB & SQL Window Functions",
    tagline: "Multi-stage ingestion, deduplication, and transformation pipeline.",
    destinationFamily: "Data Engineering",
    targetCapabilityIds: ["cap-sql", "cap-data-fund"],
    targetCapabilityNames: ["SQL & Relational Databases", "Data Processing Fundamentals"],
    proofLevel: "working",
    whyThisProject:
      "Chosen to prove advanced SQL mastery and data wrangling under streaming or batch constraints.",
    deliverables: [
      "Parameterized SQL scripts utilizing window functions and CTEs",
      "Automated schema validation and dirty data quarantine tables",
      "End-to-end reproducible run script with test dataset",
    ],
    verificationCriteria: [
      "Correct handling of late-arriving records and idempotency",
      "Window functions partition accurately without row loss",
    ],
    estimatedHours: 28,
  },

  // Financial Analysis Projects
  {
    id: "proj-fin-dynamic-dcf",
    title: "Dynamic DCF & Multi-Scenario Valuation Model",
    tagline: "Audited 3-statement forecast with sensitivity tables and WACC schedules.",
    destinationFamily: "Financial Analysis",
    targetCapabilityIds: ["cap-fin-modeling", "cap-fin-statements"],
    targetCapabilityNames: ["Financial Modeling & Valuation", "Financial Statements Analysis"],
    proofLevel: "working",
    whyThisProject:
      "Chosen specifically to provide audited proof of 3-statement modeling and sensitivity analysis for corporate finance roles.",
    deliverables: [
      "Dynamic Excel/Sheets workbook linking Income Statement, Balance Sheet, and Cash Flow",
      "Monte Carlo or 2-variable sensitivity table for terminal growth and WACC",
      "Executive summary investment memo citing key margin risks",
    ],
    verificationCriteria: [
      "Balance sheet balances across all projected periods without plug",
      "Formulas adhere to FAST financial modeling standards",
    ],
    estimatedHours: 30,
  },
  {
    id: "proj-fin-accounting-audit",
    title: "Comprehensive 10-K Forensic Accounting Breakdown",
    tagline: "Ratio decomposition, revenue recognition checks, and working capital audit.",
    destinationFamily: "Financial Analysis",
    targetCapabilityIds: ["cap-fin-accounting", "cap-fin-biz-analysis"],
    targetCapabilityNames: ["Accounting Principles", "Business & Market Analysis"],
    proofLevel: "basic",
    whyThisProject:
      "Chosen to verify fundamental accounting fluency through real-world corporate filings.",
    deliverables: [
      "Working capital trend analysis across 8 quarters",
      "DuPont ratio decomposition breakdown",
      "Written audit notes on non-recurring items and lease liabilities",
    ],
    verificationCriteria: [
      "Accurate adjustments for operating vs financing cash flows",
      "Clear articulation of business drivers behind ratio shifts",
    ],
    estimatedHours: 20,
  },
];

/**
 * Reusable domain selector: matches proof projects to unverified destination capabilities.
 * Presentation components remain 100% destination-agnostic.
 */
export function matchProjectsToGaps(
  gaps: Gap[],
  graph: DestinationGraph
): ProofProjectRecommendation[] {
  const gapCapIds = new Set(gaps.map((g) => g.capabilityId));

  // Also include unverified capabilities in graph
  const unverifiedCapIds = new Set([
    ...gapCapIds,
    ...graph.capabilityNodes.map((n) => n.id),
  ]);

  // Score projects by overlap with missing capabilities
  const scored = SEEDED_PROJECTS_CATALOG.map((proj) => {
    const matchCount = proj.targetCapabilityIds.filter((id) =>
      unverifiedCapIds.has(id)
    ).length;
    return {
      project: proj,
      matchCount,
    };
  });

  // Return projects with at least 1 match, sorted by relevance
  const matching = scored
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((s) => s.project);

  if (matching.length > 0) {
    return matching;
  }

  // Fallback: return general projects for graph destination
  return SEEDED_PROJECTS_CATALOG.slice(0, 3);
}
