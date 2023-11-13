"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});
const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
export const createInvoice = async (state: State, formData: FormData) => {
  const rawFormData = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!rawFormData.success) {
    return {
      errors: rawFormData.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${rawFormData.data.customerId}, ${
        rawFormData.data.amount * 100
      }, ${rawFormData.data.status}, ${date})
      `;
  } catch (err) {
    return { message: "Database Error: Failed to Create Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

const UpdateInvoice = InvoiceSchema.omit({ date: true, id: true });

export type EditInvoiceType = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string;
  id?: string
};

export const editInvoice = async (
  state: EditInvoiceType,
  formData: FormData
) => {
  const rawFormData = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!rawFormData.success) {
    return {
      errors: rawFormData.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${rawFormData.data.customerId}, amount = ${
        rawFormData.data.amount * 100
      }, status = ${rawFormData.data.status}
      WHERE id = ${state.id}
    `;
  } catch (err) {
    return { message: "Database Error: Failed to Edit Invoice." };
  }
  revalidatePath("/dashboard/invoices");
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
