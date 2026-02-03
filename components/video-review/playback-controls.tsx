"use client"

import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquarePlus,
} from "lucide-react"

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onStepBack: () => void
  onStepForward: () => void
  onAddComment: () => void
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onStepBack,
  onStepForward,
  onAddComment,
}: PlaybackControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          onClick={onStepBack}
        >
          <SkipBack className="h-4 w-4" />
          <span className="sr-only">Step Back</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-10 w-10 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          onClick={onStepForward}
        >
          <SkipForward className="h-4 w-4" />
          <span className="sr-only">Step Forward</span>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary gap-2"
          onClick={onAddComment}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm">Comment</span>
        </Button>
      </div>
    </div>
  )
}
