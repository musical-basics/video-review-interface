"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AnnotationCanvas } from "@/components/video-review/annotation-canvas"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause, Pen, MousePointer } from "lucide-react"
import Link from "next/link"

interface VideoData {
    id: string
    filename: string
    r2_key: string
    status: string
    created_at: string
}

export default function ReviewPage() {
    const params = useParams()
    const [video, setVideo] = useState<VideoData | null>(null)
    const [loading, setLoading] = useState(true)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)

    // Video & Annotation State
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDrawing, setIsDrawing] = useState(false)
    const [activeTool, setActiveTool] = useState("pen")

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
            setIsDrawing(false)
            setActiveTool("pointer")
        }
        setIsPlaying(!isPlaying)
    }

    useEffect(() => {
        const fetchVideo = async () => {
            if (!params.id) return

            try {
                // 1. Fetch video metadata from Supabase
                const { data, error } = await supabase
                    .from("videos")
                    .select("*")
                    .eq("id", params.id)
                    .single()

                if (error) throw error
                setVideo(data)

                // 2. Construct R2 public URL
                if (data.r2_key && process.env.NEXT_PUBLIC_R2_DOMAIN) {
                    setVideoUrl(`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${data.r2_key}`)
                }

            } catch (error) {
                console.error("Error fetching video:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchVideo()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!video || !videoUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <h1 className="text-2xl font-bold">Video not found</h1>
                <Link href="/">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 container mx-auto py-6 space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold truncate">{video.filename}</h1>
                </div>

                <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border shadow-lg">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onClick={togglePlay}
                        />
                        <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                            <AnnotationCanvas
                                isDrawing={isDrawing}
                                activeTool={activeTool}
                                onDrawingComplete={(paths) => console.log("Drawing complete:", paths)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={togglePlay}
                            >
                                {isPlaying ? (
                                    <Pause className="h-4 w-4" />
                                ) : (
                                    <Play className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant={isDrawing && activeTool === "pen" ? "default" : "outline"}
                                size="icon"
                                onClick={() => {
                                    setIsDrawing(true)
                                    setActiveTool("pen")
                                    videoRef.current?.pause()
                                }}
                            >
                                <Pen className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={!isDrawing ? "default" : "outline"}
                                size="icon"
                                onClick={() => {
                                    setIsDrawing(false)
                                    setActiveTool("pointer")
                                }}
                            >
                                <MousePointer className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
