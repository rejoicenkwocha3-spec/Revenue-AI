import { z } from "zod";
import { item } from "@/lib/routes";

export const { PATCH, DELETE } = item({ table: "teams", label: "team", action: "team.manage", schema: z.object({ name: z.string().trim().min(1).max(120), manager_id: z.string().uuid().nullable().optional() }) });
