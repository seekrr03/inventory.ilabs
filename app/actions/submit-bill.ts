"use server";

import { db } from "@/db"; // This imports from the db/index.ts file we made in Phase 2
import { items, transactions, transactionItems, vendors } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type BillInput = {
  vendorId: number;
  date: Date;
  totalAmount: number;
  billImageUrl?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    expiryDate?: Date;
  }[];
};

export async function submitBill(data: BillInput) {
  await db.transaction(async (tx) => {
    
    // 1. Create Transaction
    const [newTransaction] = await tx
      .insert(transactions)
      .values({
        type: "STOCK_IN",
        vendorId: data.vendorId,
        date: data.date,
        totalAmount: data.totalAmount.toString(),
        billImageUrl: data.billImageUrl,
      })
      .returning({ id: transactions.id });

    // 2. Loop Items
    for (const item of data.items) {
      await tx.insert(transactionItems).values({
        transactionId: newTransaction.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        expiryDate: item.expiryDate,
      });

      // 3. Update Stock
      await tx
        .update(items)
        .set({
          stock: sql`${items.stock} + ${item.quantity}`,
          lastUnitPrice: item.unitPrice.toString(),
          updatedAt: new Date(),
        })
        .where(eq(items.id, item.itemId));
    }

    // 4. Update Vendor
    await tx
      .update(vendors)
      .set({
        lastBillDate: data.date,
        totalLifetimePaid: sql`${vendors.totalLifetimePaid} + ${data.totalAmount}`,
      })
      .where(eq(vendors.id, data.vendorId));
  });

  revalidatePath("/dashboard");
  return { success: true };
}