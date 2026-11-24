import { collection } from "@/lib/routes";
import { meetingSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "meetings", label: "meeting", action: "crm.write", schema: meetingSchema, insertExtras: (c) => ({ organiser_id: c.userId }) });
