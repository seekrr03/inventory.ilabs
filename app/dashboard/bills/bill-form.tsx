"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadButton } from "@/utils/uploadthing";
import { scanBillImage } from "@/actions/scan-bill"; // Ensure this matches your Phase 1 file path
import { submitBill } from "@/actions/submit-bill"; // Ensure this matches your Phase 1 file path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Define the form shape
const formSchema = z.object({
  vendorId: z.string().min(1, "Select a vendor"),
  date: z.string(),
  totalAmount: z.number().min(0),
  items: z.array(
    z.object({
      itemId: z.number().optional(), // Real apps map this to DB IDs
      extractedName: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ),
});

export default function BillEntryForm({ vendors }: { vendors: any[] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [billUrl, setBillUrl] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
      totalAmount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // --- 1. HANDLE UPLOAD & AI SCAN ---
  const handleUploadComplete = async (res: any) => {
    const url = res[0].url;
    setBillUrl(url);
    setIsScanning(true);
    toast({ title: "Processing...", description: "AI is reading the receipt details." });

    // Call the AI Action
    const result = await scanBillImage(url);

    if (result.success && result.data) {
      // Auto-fill the form fields
      form.setValue("date", result.data.billDate || new Date().toISOString().split("T")[0]);
      form.setValue("totalAmount", result.data.totalAmount);
      
      // Clear old items, add new AI items
      remove(); 
      result.data.lineItems.forEach((item: any) => {
        append({
          extractedName: item.productName,
          quantity: item.qty,
          unitPrice: item.unitPrice,
        });
      });
      
      toast({ title: "Done!", description: "Bill details extracted." });
    } else {
      toast({ variant: "destructive", title: "Scan Failed", description: "Could not read image." });
    }
    setIsScanning(false);
  };

  // --- 2. HANDLE SAVE TO DATABASE ---
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await submitBill({
        vendorId: parseInt(data.vendorId),
        date: new Date(data.date),
        totalAmount: data.totalAmount,
        billImageUrl: billUrl,
        items: data.items.map(i => ({
          itemId: 1, // NOTE: In a finished app, you'd select the specific item ID here
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      });
      toast({ title: "Success!", description: "Inventory updated." });
      router.refresh();
      form.reset();
      setBillUrl("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save bill." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT: Upload Area */}
      <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[400px]">
        {billUrl ? (
          <div className="text-center w-full">
            <img src={billUrl} alt="Bill" className="max-h-[400px] mx-auto object-contain shadow-md rounded mb-4" />
            <Button variant="outline" size="sm" onClick={() => setBillUrl("")}>Remove Image</Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block">
               <Wand2 className="w-8 h-8 text-blue-500" />
            </div>
            <div>
                <h3 className="font-semibold text-lg">AI Bill Scanner</h3>
                <p className="text-sm text-gray-500 mb-4">Upload a photo to auto-fill details</p>
                <UploadButton
                endpoint="billImage"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => alert(`Upload Error: ${error.message}`)}
                />
            </div>
          </div>
        )}
        {isScanning && (
            <div className="mt-6 flex items-center gap-2 text-blue-600 font-medium animate-pulse">
                <Loader2 className="animate-spin h-5 w-5" /> Analyzing Receipt...
            </div>
        )}
      </div>

      {/* RIGHT: Edit Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor</label>
            <select {...form.register("vendorId")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Select Vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {form.formState.errors.vendorId && <p className="text-red-500 text-xs">{form.formState.errors.vendorId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bill Date</label>
            <Input type="date" {...form.register("date")} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Total Amount</label>
          <div className="relative">
             <span className="absolute left-3 top-2.5 text-gray-500">$</span>
             <Input type="number" step="0.01" className="pl-7" {...form.register("totalAmount", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm text-gray-700">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ extractedName: "", quantity: 1, unitPrice: 0 })}>
                <Plus className="w-4 h-4 mr-2" /> Manual Add
              </Button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg border">
                <div className="col-span-6">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Item</p>
                  <Input {...form.register(`items.${index}.extractedName`)} className="h-8 text-xs bg-white" placeholder="Product name" />
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Qty</p>
                  <Input type="number" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-8 text-xs bg-white" />
                </div>
                <div className="col-span-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Price</p>
                  <Input type="number" step="0.01" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} className="h-8 text-xs bg-white" />
                </div>
                <div className="col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-medium h-11" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
              "Confirm & Add to Stock"
          )}
        </Button>
      </form>
    </div>
  );
}