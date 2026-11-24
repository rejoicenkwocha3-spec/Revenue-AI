import { collection } from "@/lib/routes";
import { taskSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "tasks", label: "task", action: "crm.write", schema: taskSchema, insertExtras: (c) => ({ created_by: c.userId }) });
