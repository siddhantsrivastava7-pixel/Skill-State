import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LearnerStateSnapshotSchema,
  type LearnerStateSnapshot,
} from "./schema";

export interface LearnerStateRow {
  user_id: string;
  state_json: unknown;
  schema_version: number;
  revision: number;
  updated_at?: string;
}

export interface LearnerStateBackend {
  loadRow(userId: string): Promise<LearnerStateRow | null>;
  saveRow(input: {
    userId: string;
    snapshot: LearnerStateSnapshot;
    expectedRevision: number | null;
  }): Promise<number>;
  deleteRows(userId: string): Promise<void>;
}

export class RemoteStateOwnershipError extends Error {
  constructor() {
    super("The remote SkillState row does not belong to the active user.");
    this.name = "RemoteStateOwnershipError";
  }
}

export class CorruptRemoteStateError extends Error {
  readonly rawRow: LearnerStateRow;

  constructor(row: LearnerStateRow) {
    super("Saved SkillState data could not be validated and was left unchanged.");
    this.name = "CorruptRemoteStateError";
    this.rawRow = row;
  }
}

export class SupabaseLearnerStateBackend implements LearnerStateBackend {
  constructor(private readonly client: SupabaseClient) {}

  async loadRow(userId: string): Promise<LearnerStateRow | null> {
    const { data, error } = await this.client
      .from("skillstate_learner_state")
      .select("user_id,state_json,schema_version,revision,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as LearnerStateRow | null;
  }

  async saveRow(input: {
    userId: string;
    snapshot: LearnerStateSnapshot;
    expectedRevision: number | null;
  }): Promise<number> {
    const { data, error } = await this.client.rpc("skillstate_save_learner_state", {
      p_state_json: input.snapshot,
      p_schema_version: input.snapshot.schemaVersion,
      p_expected_revision: input.expectedRevision,
    });
    if (error) throw error;
    if (typeof data !== "number") {
      throw new Error("SkillState persistence returned an invalid revision.");
    }
    return data;
  }

  async deleteRows(userId: string): Promise<void> {
    const learnerDelete = await this.client
      .from("skillstate_learner_state")
      .delete()
      .eq("user_id", userId);
    if (learnerDelete.error) throw learnerDelete.error;
    const profileDelete = await this.client
      .from("skillstate_profiles")
      .delete()
      .eq("user_id", userId);
    if (profileDelete.error) throw profileDelete.error;
  }
}

export interface LoadedLearnerState {
  snapshot: LearnerStateSnapshot;
  revision: number;
}

export class LearnerStateRepository {
  constructor(private readonly backend: LearnerStateBackend) {}

  async load(userId: string): Promise<LoadedLearnerState | null> {
    const row = await this.backend.loadRow(userId);
    if (!row) return null;
    if (row.user_id !== userId) throw new RemoteStateOwnershipError();
    const parsed = LearnerStateSnapshotSchema.safeParse(row.state_json);
    if (!parsed.success || row.schema_version !== parsed.data?.schemaVersion) {
      throw new CorruptRemoteStateError(row);
    }
    if (parsed.data.profile.id !== userId) throw new RemoteStateOwnershipError();
    return { snapshot: parsed.data, revision: row.revision };
  }

  async save(
    userId: string,
    snapshotInput: unknown,
    expectedRevision: number | null
  ): Promise<number> {
    const snapshot = LearnerStateSnapshotSchema.parse(snapshotInput);
    if (snapshot.profile.id !== userId) throw new RemoteStateOwnershipError();
    return this.backend.saveRow({ userId, snapshot, expectedRevision });
  }

  delete(userId: string): Promise<void> {
    return this.backend.deleteRows(userId);
  }
}
