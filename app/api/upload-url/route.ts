import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({
    url: "https://fake-s3-upload-url.com/destination",
    fileId: "fake-review-id-123"
  });
}
