"use client"

import { useState, useRef, useCallback } from "react"
import { VideoPlayer, VideoPlayerRef } from "@/components/video-review/video-player"
import { AnnotationCanvas } from "@/components/video-review/annotation-canvas"
import { SpatialComments } from "@/components/video-review/spatial-comments"
import { ActionToolbar } from "@/components/video-review/action-toolbar"
import { PlaybackControls } from "@/components/video-review/playback-controls"
import { RichTimeline } from "@/components/video-review/rich-timeline"
import { CommentsSidebar } from "@/components/video-review/comments-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Download,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Film,
} from "lucide-react"

// Mock data
const initialComments = [
  {
    id: 1,
    time: 15.5,
    text: "Color grade looks off here - too warm for the mood we're going for",
    type: "drawing",
    x: 40,
    y: 30,
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      initials: "SC",
    },
  },
  {
    id: 2,
    time: 45.2,
    text: "Swap with B-Roll from the outdoor shoot",
    type: "replacement",
    link: "clip_v2.mp4",
    author: {
      name: "Marcus Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      initials: "MJ",
    },
  },
  {
    id: 3,
    time: 78.0,
    text: "Add lower third title here: 'Interview with CEO'",
    type: "text",
    x: 25,
    y: 85,
    author: {
      name: "Emily Rodriguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      initials: "ER",
    },
  },
  {
    id: 4,
    time: 120.5,
    text: "Great shot! Keep this one for sure.",
    type: "general",
    author: {
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      initials: "DK",
    },
  },
  {
    id: 5,
    time: 180.0,
    text: "Audio levels drop here - needs adjustment",
    type: "general",
    x: 70,
    y: 50,
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      initials: "SC",
    },
  },
]

export default function VideoReviewPage() {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(596.5) // Big Buck Bunny duration
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTool, setActiveTool] = useState("pointer")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comments, setComments] = useState(initialComments)

  const videoRef = useRef<VideoPlayerRef>(null)

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time)
    videoRef.current?.seekTo(time)
  }, [])

  const handleCommentClick = useCallback((comment: { time: number }) => {
    handleSeek(comment.time)
    setIsPlaying(false)
  }, [handleSeek])

  const handleAddComment = useCallback(
    (text: string, link?: string) => {
      const newComment = {
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
    setActiveTool(tool)
    if (tool !== "pointer") {
      setIsPlaying(false)
    }
  }, [])

  const isAnnotating = activeTool !== "pointer"

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Film className="h-5 w-5" />
            <span className="font-semibold">FrameReview</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div>
            <h1 className="text-sm font-medium text-foreground">
              Product_Launch_Final_v3.mp4
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Version 3</span>
              <span>•</span>
              <span>Uploaded 2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-accent/10 text-accent border-accent/30"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ready for Review
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
            {/* Video element */}
            <VideoPlayer
              ref={videoRef}
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

        {/* Comments sidebar */}
        <CommentsSidebar
          comments={comments}
          currentTime={currentTime}
          onCommentClick={handleCommentClick}
          showCommentInput={showCommentInput}
          onAddComment={handleAddComment}
          onCloseInput={() => setShowCommentInput(false)}
        />
      </div>
    </div>
  )
}
