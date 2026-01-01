"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const ExtractedBillSchema = z.object({
  vendorName: z.string().describe("The name of the store or supplier"),
  billDate: z.string().describe("Format YYYY-MM-DD. Use today if not found."),
  totalAmount: z.number().describe("The final total of the bill"),
  lineItems: z.array(
    z.object({
      productName: z.string(),
      qty: z.number(),
      unitPrice: z.number(),
    })
  ),
});

export async function scanBillImage(imageUrl: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ExtractedBillSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this bill. Extract vendor, date, total, and all line items." },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });

    return { success: true, data: object };
  } catch (error) {
    console.error("AI Scan Failed:", error);
    return { success: false, error: "Failed to read image" };
  }
}