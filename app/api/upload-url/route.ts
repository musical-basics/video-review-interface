import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    // Create a unique file key (avoid overwrites)
    const fileKey = `${Date.now()}-${filename.replace(/\s+/g, '-')}`;

    const signedUrl = await getSignedUrl(
      R2,
      new PutObjectCommand({
        Bucket: "clipreview-assets", // Your exact bucket name
        Key: fileKey,
        ContentType: contentType,
      }),
      { expiresIn: 600 } // Link expires in 10 minutes
    );

    return NextResponse.json({ url: signedUrl, key: fileKey });
  } catch (error) {
    console.error("R2 Error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
