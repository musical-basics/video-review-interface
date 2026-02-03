"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Upload, FileVideo, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function UploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setFileName(file.name);

        try {
            // 1. Get the Presigned URL from our API
            const response = await fetch("/api/upload-url", {
                method: "POST",
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });
            const { url, key } = await response.json();

            // 2. Upload DIRECTLY to Cloudflare R2
            const uploadResponse = await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadResponse.ok) throw new Error("Upload to R2 failed");

            // 3. Save metadata to Supabase
            const { data, error } = await supabase
                .from("videos")
                .insert({
                    filename: file.name,
                    r2_key: key,
                    status: "ready",
                })
                .select()
                .single();

            if (error) throw error;

            // 4. Redirect to the Review Page
            router.push(`/review/${data.id}`);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("video/")) {
                uploadFile(file);
            } else {
                alert("Please upload a video file.");
            }
        }
    }, []);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
                    <p className="text-muted-foreground">
                        Drag and drop your video file to start the review process
                    </p>
                </div>

                <Card
                    className={cn(
                        "border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer",
                        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        "hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <CardContent className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
                        {isUploading ? (
                            <div className="w-full max-w-sm space-y-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="p-4 rounded-full bg-primary/10 animate-pulse">
                                        <FileVideo className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">{fileName}</p>
                                        <p className="text-sm text-muted-foreground">Uploading...</p>
                                    </div>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-full bg-muted">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">
                                        Drag video here
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        or click to select files (Drag & Drop only for this demo)
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
