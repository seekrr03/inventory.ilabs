import { db } from "@/db"; 
import { vendors } from "@/db/schema";
import BillEntryForm from "./bill-form";

export default async function BillsPage() {
  // Fetch vendors from DB
  const vendorList = await db.select().from(vendors);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bill Entry</h1>
        <p className="text-gray-500 mt-2">
            Upload a new receipt to automatically update inventory levels and track spending.
        </p>
      </div>
      
      {/* Render the Client Component */}
      <BillEntryForm vendors={vendorList} />
    </div>
  );
}