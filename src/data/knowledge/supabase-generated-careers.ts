import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DestinationGraphSchema } from "@/domain/schemas";
import type { DestinationGraph } from "@/domain/types";
import { knowledgeMetadata, normalizeCareerLookup } from "./repositories";
import { CareerKnowledgeSchema } from "./schemas";
import type { CareerKnowledge } from "./types";

export interface GeneratedCareerCache {
  findGraphByTitleOrAlias(input: string): Promise<DestinationGraph | null>;
  saveValidated(
    career: CareerKnowledge,
    graph: DestinationGraph,
    requestedAlias: string,
    createdBy: string
  ): Promise<boolean>;
}

function canonicalSlug(value: string): string {
  return normalizeCareerLookup(value).replace(/\s+/g, "-");
}

interface GeneratedCareerRow {
  id: string;
  canonical_slug: string;
  career_json: unknown;
  graph_json: unknown;
  status: string;
}

export class SupabaseGeneratedCareerCache implements GeneratedCareerCache {
  constructor(private readonly client: SupabaseClient) {}

  private parseRow(row: GeneratedCareerRow | null): DestinationGraph | null {
    if (!row || row.status !== "validated") return null;
    const career = CareerKnowledgeSchema.safeParse(row.career_json);
    const graph = DestinationGraphSchema.safeParse(row.graph_json);
    return career.success && graph.success ? graph.data : null;
  }

  async findGraphByTitleOrAlias(input: string): Promise<DestinationGraph | null> {
    const normalized = normalizeCareerLookup(input);
    const aliasResult = await this.client
      .from("skillstate_generated_career_aliases")
      .select("career_id")
      .eq("normalized_alias", normalized)
      .maybeSingle();
    if (aliasResult.error) throw aliasResult.error;

    let query = this.client
      .from("skillstate_generated_careers")
      .select("id,canonical_slug,career_json,graph_json,status");
    query = aliasResult.data?.career_id
      ? query.eq("id", aliasResult.data.career_id)
      : query.eq("canonical_slug", canonicalSlug(input));
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    const graph = this.parseRow(data as GeneratedCareerRow | null);
    if (graph && data?.id) {
      await this.client
        .from("skillstate_generated_careers")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id);
    }
    return graph;
  }

  async saveValidated(
    careerInput: CareerKnowledge,
    graphInput: DestinationGraph,
    requestedAlias: string,
    createdBy: string
  ): Promise<boolean> {
    const career = CareerKnowledgeSchema.parse(careerInput);
    const graph = DestinationGraphSchema.parse(graphInput);
    const slug = canonicalSlug(career.title || career.id);
    const now = new Date().toISOString();
    const insert = await this.client
      .from("skillstate_generated_careers")
      .upsert({
        canonical_slug: slug,
        display_name: career.title,
        career_json: career,
        graph_json: graph,
        knowledge_version: knowledgeMetadata.version,
        status: "validated",
        created_by: createdBy,
        updated_at: now,
        last_used_at: now,
      }, { onConflict: "canonical_slug", ignoreDuplicates: true });
    if (insert.error) throw insert.error;

    const { data: stored, error: readError } = await this.client
      .from("skillstate_generated_careers")
      .select("id")
      .eq("canonical_slug", slug)
      .single();
    if (readError || !stored) throw readError ?? new Error("Generated career was not stored.");

    const aliases = Array.from(new Set([
      career.id,
      career.title,
      requestedAlias,
      ...career.aliases,
    ].map(normalizeCareerLookup).filter(Boolean)));
    const aliasWrite = await this.client
      .from("skillstate_generated_career_aliases")
      .upsert(
        aliases.map((alias) => ({ normalized_alias: alias, career_id: stored.id })),
        { onConflict: "normalized_alias", ignoreDuplicates: true }
      );
    if (aliasWrite.error) throw aliasWrite.error;
    return true;
  }
}
