"use client";
import { useState } from "react";
import { FormModal, type FieldDef } from "@/components/app/forms";

export function AutoOpen({ fields, ownerId }: { fields: FieldDef[]; ownerId: string }) {
  const [open, setOpen] = useState(true);
  return <FormModal open={open} onClose={() => setOpen(false)} title="New opportunity" endpoint="/api/opportunities" fields={fields} initial={{ forecast_category: "pipeline", deal_type: "new_business", owner_id: ownerId }} submitLabel="Create opportunity" />;
}
