"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {

  try {
    const rawFormData = CreateInvoice.parse(
      Object.fromEntries(formData.entries())
    );
    const date = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${rawFormData.customerId}, ${rawFormData.amount * 100}, ${
        rawFormData.status
      }, ${date})
      `;
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { message: "Validation Error: Failed to Create Invoice." };
    }
    return { message: "Database Error: Failed to Create Invoice." };
  }

  redirect("/dashboard/invoices");
};

const UpdateInvoice = InvoiceSchema.omit({ date: true, id: true });

export const editInvoice = async (id: string, formData: FormData) => {
  try {
    const rawFormData = UpdateInvoice.parse(
      Object.fromEntries(formData.entries())
    );

    await sql`
      UPDATE invoices
      SET customer_id = ${rawFormData.customerId}, amount = ${
        rawFormData.amount * 100
      }, status = ${rawFormData.status}
      WHERE id = ${id}
    `;

    revalidatePath("/dashboard/invoices");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { message: "Validation Error: Failed to Edit Invoice." };
    }
    return { message: "Database Error: Failed to Edit Invoice." };
  }

  redirect("/dashboard/invoices");
};

export const deleteInvoice = async (id: string) => {
  try {
    await sql`
  DELETE FROM invoices WHERE id = ${id}
`;
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { message: "Database Error: Failed to Delete Invoice." };
  }
  redirect("/dashboard/invoices");
};
