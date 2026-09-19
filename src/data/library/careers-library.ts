import { DestinationGraph, VerifiedCapabilityState } from "@/domain/types";
import { personaAGraph, personaBGraph, personaCGraph } from "../demo";

export interface CareerPathItem {
  id: string;
  title: string;
  field: string;
  description: string;
  planningDecisionPointMonths?: number;
  /** Legacy catalog estimate retained for domain compatibility; UI labels it separately. */
  targetHorizonMonths: number;
  graph: DestinationGraph;
  sharedCapabilities: string[];
  overlapPercentage: number;
  unverifiedCapabilitiesCount: number;
  isPreview?: boolean;
}

// Supplementary graph for Data Engineer
export const dataEngineerGraph: DestinationGraph = {
  destinationId: "dest-data-engineer",
  destinationName: "Data Engineer",
  summary:
    "Design, construct, and manage scalable data pipelines, distributed storage, and streaming infrastructure.",
  confidence: "high",
  capabilityNodes: [
    {
      id: "cap-python",
      name: "Python Programming",
      family: "Programming",
      description: "Data wrangling, script automation, and modular clean code.",
      importance: "core",
      stageExpected: "foundation",
      prerequisites: [],
      unlocks: ["cap-sql", "cap-etl"],
    },
    {
      id: "cap-sql",
      name: "SQL & Relational Databases",
      family: "Data Architecture",
      description: "Analytical SQL, indexing, window functions, and relational schema design.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: [],
      unlocks: ["cap-etl", "cap-data-warehousing"],
    },
    {
      id: "cap-etl",
      name: "Data Pipeline Engineering & Orchestration",
      family: "Data Systems",
      description: "DAG workflows, automated scheduled jobs, and idempotent data transformations.",
      importance: "core",
      stageExpected: "developing",
      prerequisites: ["cap-python", "cap-sql"],
      unlocks: ["cap-data-warehousing"],
    },
    {
      id: "cap-data-warehousing",
      name: "Data Warehousing & Columnar Storage",
      family: "Storage",
      description: "BigQuery, Snowflake, dimensional modeling, and partition strategies.",
      importance: "important",
      stageExpected: "developing",
      prerequisites: ["cap-sql"],
      unlocks: [],
    },
    {
      id: "cap-cloud-infra",
      name: "Cloud Infrastructure & Containerization",
      family: "Operations",
      description: "Docker, cloud IAM, storage buckets, and deployment pipelines.",
      importance: "important",
      stageExpected: "specialist",
      prerequisites: ["cap-python"],
      unlocks: [],
    },
  ],
  proofExpectations: [
    {
      id: "proof-de-pipeline",
      capabilityId: "cap-etl",
      description: "Automated end-to-end data pipeline transforming raw events into an analytical table.",
      level: "working",
    },
  ],
  experienceExpectations: [
    {
      id: "exp-de-internship",
      title: "Data Engineering Internship",
      description: "Experience maintaining analytical data pipelines and data quality checks.",
      type: "internship",
    },
  ],
  adjacentDestinations: [
    {
      id: "dest-ai-engineer",
      title: "AI Engineer",
      descriptor: "Machine learning model development and serving.",
      tone: "purple",
      sharedCapabilityIds: ["cap-python", "cap-sql"],
    },
  ],
  sharedFoundationNodeIds: ["cap-python", "cap-sql"],
  decisionPointMonths: 6,
};

export const SEEDED_CAREER_PATHS_CATALOG: Array<{
  id: string;
  field: "Technology & AI" | "Data & Systems" | "Finance & Markets" | "Engineering" | "Strategy & Advisory";
  graph: DestinationGraph;
}> = [
  {
    id: "career-ai-engineer",
    field: "Technology & AI",
    graph: personaBGraph,
  },
  {
    id: "career-data-engineer",
    field: "Data & Systems",
    graph: dataEngineerGraph,
  },
  {
    id: "career-financial-analyst",
    field: "Finance & Markets",
    graph: personaCGraph,
  },
  {
    id: "career-software-engineer",
    field: "Engineering",
    graph: personaAGraph,
  },
];

/**
 * Calculates transferable foundation overlap between current verified states and candidate career paths.
 */
export function calculateCareerPathsWithOverlap(
  currentGraph: DestinationGraph,
  verifiedStates: Record<string, VerifiedCapabilityState>,
  isDemoState = false
): CareerPathItem[] {
  const catalog = isDemoState
    ? SEEDED_CAREER_PATHS_CATALOG
    : [
        {
          id: `career-current-${currentGraph.destinationId}`,
          field: "Current destination" as const,
          graph: currentGraph,
          isPreview: false,
        },
        ...currentGraph.adjacentDestinations.map((adjacent) => {
          const sharedNodes = adjacent.sharedCapabilityIds
            .map((id) => currentGraph.capabilityNodes.find((node) => node.id === id))
            .filter((node): node is DestinationGraph["capabilityNodes"][number] => Boolean(node));
          const previewGraph: DestinationGraph = {
            destinationId: adjacent.id,
            destinationName: adjacent.title,
            summary: adjacent.descriptor,
            confidence: "medium",
            capabilityNodes: sharedNodes,
            proofExpectations: [],
            experienceExpectations: [],
            adjacentDestinations: [],
            sharedFoundationNodeIds: sharedNodes.map((node) => node.id),
          };
          return {
            id: `career-adjacent-${adjacent.id}`,
            field: "Adjacent destination" as const,
            graph: previewGraph,
            isPreview: true,
          };
        }),
      ];

  return catalog.map((c) => {
    const totalNodes = c.graph.capabilityNodes.length;
    const verifiedMatching = c.graph.capabilityNodes.filter(
      (n) => verifiedStates[n.id]?.state === "verified"
    );

    const overlapPercentage =
      totalNodes > 0 ? Math.round((verifiedMatching.length / totalNodes) * 100) : 0;

    return {
      id: c.id,
      title: c.graph.destinationName,
      field: c.field,
      description: c.graph.summary,
      planningDecisionPointMonths: c.graph.decisionPointMonths,
      targetHorizonMonths: c.graph.decisionPointMonths ?? 12,
      graph: c.graph,
      sharedCapabilities: verifiedMatching.map((n) => n.name),
      overlapPercentage,
      unverifiedCapabilitiesCount: totalNodes - verifiedMatching.length,
      isPreview: "isPreview" in c ? c.isPreview : false,
    };
  });
}
