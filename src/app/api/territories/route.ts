import { z } from "zod";
import { collection } from "@/lib/routes";

export const { POST } = collection({ table: "territories", label: "territory", action: "team.manage", schema: z.object({ name: z.string().trim().min(1).max(120), region: z.string().trim().max(120).nullable().optional(), description: z.string().trim().max(1000).nullable().optional() }), auditCreate: true });
