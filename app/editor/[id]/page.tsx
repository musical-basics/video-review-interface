"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Film,
    CheckCircle2,
    Download,
    Share2,
    MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { AssetPicker } from "@/components/video-review/asset-picker"

// Import Rich UI Components
import { VideoPlayer } from "@/components/video-review/video-player"
import { AnnotationCanvas } from "@/components/video-review/annotation-canvas"
import { SpatialComments } from "@/components/video-review/spatial-comments"
import { ActionToolbar } from "@/components/video-review/action-toolbar"
import { PlaybackControls } from "@/components/video-review/playback-controls"
import { RichTimeline } from "@/components/video-review/rich-timeline"
import { CommentsSidebar } from "@/components/video-review/comments-sidebar"

interface VideoData {
    id: string
    filename: string
    r2_key: string
    status: string
    created_at: string
}

interface Comment {
    id: number
    time: number
    text: string
    type: "general" | "issue" | "praise" | "question" | "replacement"
    author: {
        name: string
        avatar: string
        initials: string
    }
    x?: number
    y?: number
    resolved?: boolean
    link?: string
}

export default function EditorPage() {
    const params = useParams()
    const [video, setVideo] = useState<VideoData | null>(null)
    const [loading, setLoading] = useState(true)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)

    // Editor State (from original app/page.tsx)
    const videoRef = useRef<any>(null)
    const [activeTool, setActiveTool] = useState("pointer")
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showCommentInput, setShowCommentInput] = useState(false)
    const [showAssetPicker, setShowAssetPicker] = useState(false)
    const [comments, setComments] = useState<Comment[]>([]) // TODO: Fetch from Supabase

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


    // Handlers (Adapted from original UI)
    const handlePlayPause = useCallback(() => {
        setIsPlaying((prev) => !prev)
    }, [])

    const handleSeek = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.seekTo(time)
            setCurrentTime(time)
        }
    }, [])

    const handleCommentClick = useCallback((comment: Comment) => {
        if (comment) {
            handleSeek(comment.time)
        }
    }, [handleSeek])

    const handleAddComment = useCallback(
        (text: string, link?: string) => {
            // simplified for now to match child component signature
            const newComment: Comment = {
                id: Date.now(),
                time: currentTime,
                text,
                type: link ? "replacement" : "general",
                link,
                author: {
                    name: "You",
                    avatar: "",
                    initials: "YO",
                },
            }
            setComments((prev) => [...prev, newComment])
            setShowCommentInput(false)
        },
        [currentTime]
    )

    const handleToolChange = useCallback((tool: string) => {
        if (tool === "link") {
            setShowAssetPicker(true)
            return
        }
        setActiveTool(tool)
        if (tool !== "pointer" && tool !== "hand" && tool !== "eraser") {
            setIsPlaying(false)
            videoRef.current?.pause()
        }
    }, [])

    const handleAssetSelect = (asset: any) => {
        setShowAssetPicker(false)

        // Add "Replacement" Comment
        if (!process.env.NEXT_PUBLIC_R2_DOMAIN) return

        const assetUrl = `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${asset.r2_key}`

        const newComment: Comment = {
            id: Date.now(),
            time: currentTime,
            text: `Attached: ${asset.filename}`,
            type: "replacement",
            link: assetUrl,
            author: {
                name: "You",
                avatar: "",
                initials: "YO",
            },
        }
        setComments((prev) => [...prev, newComment])
    }

    const isAnnotating = activeTool !== "pointer"


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
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Top Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                        <Film className="h-5 w-5" />
                        <span className="font-semibold">FrameReview</span>
                    </Link>
                    <div className="w-px h-5 bg-border" />
                    <div>
                        <h1 className="text-sm font-medium text-foreground max-w-[200px] truncate" title={video.filename}>
                            {video.filename}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>V1</span>
                            <span>•</span>
                            <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className="bg-accent/10 text-accent border-accent/30 capitalize"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {video.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video player area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Player container */}
                    <div className="flex-1 bg-black relative overflow-hidden">
                        {/* Video element - Passed videoUrl here! */}
                        <VideoPlayer
                            ref={videoRef}
                            src={videoUrl}
                            currentTime={currentTime}
                            isPlaying={isPlaying}
                            onTimeUpdate={setCurrentTime}
                            onDurationChange={setDuration}
                            onPlayPause={handlePlayPause}
                        />

                        {/* Annotation canvas overlay */}
                        <AnnotationCanvas
                            isDrawing={isAnnotating}
                            activeTool={activeTool}
                        />

                        {/* Spatial comments */}
                        <SpatialComments
                            comments={comments}
                            currentTime={currentTime}
                            onCommentClick={handleCommentClick}
                        />

                        {/* Action toolbar */}
                        <ActionToolbar
                            activeTool={activeTool}
                            onToolChange={handleToolChange}
                        />

                        {/* Playback controls */}
                        <PlaybackControls
                            isPlaying={isPlaying}
                            onPlayPause={handlePlayPause}
                            onStepBack={() => videoRef.current?.stepFrame("backward")}
                            onStepForward={() => videoRef.current?.stepFrame("forward")}
                            onAddComment={() => {
                                setIsPlaying(false)
                                setShowCommentInput(true)
                            }}
                        />
                    </div>

                    {/* Timeline */}
                    <RichTimeline
                        currentTime={currentTime}
                        duration={duration}
                        comments={comments}
                        onSeek={handleSeek}
                        onCommentClick={handleCommentClick}
                    />
                </div>

                <CommentsSidebar
                    comments={comments}
                    currentTime={currentTime}
                    onCommentClick={handleCommentClick}
                    showCommentInput={showCommentInput}
                    onAddComment={handleAddComment}
                    onCloseInput={() => setShowCommentInput(false)}
                />
            </div>

            <AssetPicker
                open={showAssetPicker}
                onOpenChange={setShowAssetPicker}
                onSelect={handleAssetSelect}
            />
        </div>
    )
}
