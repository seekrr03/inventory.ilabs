import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Define "billImage" endpoint
  billImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      // Secure it: Only logged in users can upload
      const session = await auth();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user?.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete by:", metadata.userId);
      console.log("File URL:", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;