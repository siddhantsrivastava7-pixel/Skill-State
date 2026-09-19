import { ResourceRecommendation } from "@/domain/types";

export const SEEDED_RESOURCES: ResourceRecommendation[] = [
  {
    id: "res-py-1",
    title: "Python Official Tutorial — Control Flow & Data Structures",
    format: "documentation",
    provider: "python.org",
    estimatedMinutes: 90,
    matchedGapId: "cap-prog-fund",
    whyThis: "Authoritative, idiomatic guide to foundational Python syntax.",
    url: "https://docs.python.org/3/tutorial/",
  },
  {
    id: "res-linalg-1",
    title: "Linear Algebra Review and Reference",
    format: "article",
    provider: "Stanford CS229",
    estimatedMinutes: 120,
    matchedGapId: "cap-linalg",
    whyThis: "Visual intuition for matrix transformations, dot products, and vector spaces.",
    url: "https://cs229.stanford.edu/section/cs229-linalg.pdf",
  },
  {
    id: "res-ml-eval-1",
    title: "Metrics and scoring: quantifying the quality of predictions",
    format: "project-guide",
    provider: "Scikit-Learn User Guide",
    estimatedMinutes: 60,
    matchedGapId: "cap-ml",
    whyThis: "Hands-on guide to handling class imbalance and evaluation metrics.",
    url: "https://scikit-learn.org/stable/modules/model_evaluation.html",
  },
  {
    id: "res-deploy-1",
    title: "FastAPI Tutorial",
    format: "project-guide",
    provider: "FastAPI Documentation",
    estimatedMinutes: 180,
    matchedGapId: "cap-deployment",
    whyThis: "End-to-end containerized inference deployment walkthrough.",
    url: "https://fastapi.tiangolo.com/tutorial/",
  },
];
