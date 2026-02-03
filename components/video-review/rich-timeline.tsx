"use client"

import React from "react"

import { useState, useRef } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { MessageSquare, MessageSquareOff } from "lucide-react"

import { Comment } from "@/types/video-review"

interface RichTimelineProps {
  currentTime: number
  duration: number
  comments: Comment[]
  onSeek: (time: number) => void
  onCommentClick: (comment: Comment) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 30)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

const getMarkerColor = (type: string) => {
  switch (type) {
    case "drawing":
      return "bg-marker-yellow"
    case "replacement":
      return "bg-marker-cyan"
    case "text":
      return "bg-marker-pink"
    default:
      return "bg-marker-green"
  }
}

export function RichTimeline({
  currentTime,
  duration,
  comments,
  onSeek,
  onCommentClick,
}: RichTimelineProps) {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<number>(0)
  const [showAllBubbles, setShowAllBubbles] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    setHoverPosition(percentage * 100)
    setHoverTime(percentage * duration)
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    onSeek(percentage * duration)
  }

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <TooltipProvider>
      <div className="w-full bg-card border-t border-border px-4 py-3">
        {/* Time display */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Timeline track */}
        <div
          ref={trackRef}
          className="relative h-10 bg-secondary rounded-md cursor-pointer group"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-full bg-primary/30 rounded-l-md"
            style={{ width: `${playheadPosition}%` }}
          />

          {/* Waveform visual (decorative) */}
          <div className="absolute inset-0 flex items-center px-1 opacity-40">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 mx-px bg-muted-foreground/50 rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 10}%`,
                }}
              />
            ))}
          </div>

          {/* Comment markers with speech bubbles */}
          {comments.map((comment) => {
            const position = duration > 0 ? (comment.time / duration) * 100 : 0

            // Speech bubble component (reused for both modes)
            const SpeechBubble = ({ compact = false }: { compact?: boolean }) => (
              <div className="relative">
                <div className={`
                  relative px-2.5 py-1.5 rounded-lg shadow-xl
                  bg-popover border border-border
                  ${compact ? "max-w-[200px] min-w-[120px]" : "max-w-[280px] min-w-[160px]"}
                `}>
                  {/* Author and timestamp header */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar || "/placeholder.svg"}
                        alt={comment.author.name}
                        className={`${compact ? "w-4 h-4" : "w-5 h-5"} rounded-full object-cover`}
                      />
                    ) : comment.author?.initials ? (
                      <div className={`${compact ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]"} rounded-full bg-primary/20 flex items-center justify-center font-medium text-primary`}>
                        {comment.author.initials}
                      </div>
                    ) : null}
                    <span className={`${compact ? "text-[10px]" : "text-xs"} font-medium text-foreground truncate`}>
                      {comment.author?.name || "Anonymous"}
                    </span>
                    <span className={`${compact ? "text-[9px]" : "text-[10px]"} font-mono text-muted-foreground ml-auto`}>
                      @{formatTime(comment.time).slice(0, 5)}
                    </span>
                  </div>
                  {/* Comment text */}
                  <p className={`${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"} text-foreground/90 leading-relaxed`}>
                    {comment.text}
                  </p>
                  {/* Type indicator */}
                  <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border/50">
                    <div className={`w-1.5 h-1.5 rounded-full ${getMarkerColor(comment.type)}`} />
                    <span className="text-[9px] text-muted-foreground capitalize">
                      {comment.type === "text" ? "Text Note" : comment.type}
                    </span>
                  </div>
                </div>
                {/* Speech bubble tail/arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-popover" />
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-border -z-10" />
                </div>
              </div>
            )

            return (
              <div key={comment.id} className="absolute top-1" style={{ left: `${position}%` }}>
                {/* Always visible speech bubble */}
                {showAllBubbles && (
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCommentClick(comment)
                    }}
                  >
                    <SpeechBubble compact />
                  </div>
                )}

                {/* Marker dot with hover tooltip */}
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      className={`absolute w-2.5 h-2.5 rounded-full ${getMarkerColor(comment.type)} 
                        transform -translate-x-1/2 hover:scale-150 transition-all z-10
                        ring-2 ring-background shadow-lg cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCommentClick(comment)
                      }}
                    />
                  </TooltipTrigger>
                  {!showAllBubbles && (
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="p-0 bg-transparent border-none shadow-none"
                    >
                      <SpeechBubble />
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            )
          })}

          {/* Hover ghost cursor */}
          {hoverPosition !== null && (
            <div
              className="absolute top-0 h-full w-px bg-foreground/50 pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs font-mono whitespace-nowrap">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary pointer-events-none z-20"
            style={{ left: `${playheadPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
          </div>
        </div>

        {/* Marker legend and toggle */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-marker-yellow" />
              <span>Drawing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-marker-cyan" />
              <span>Replacement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-marker-pink" />
              <span>Text Note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-marker-green" />
              <span>General</span>
            </div>
          </div>

          {/* Toggle speech bubbles */}
          <Button
            variant={showAllBubbles ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowAllBubbles(!showAllBubbles)}
          >
            {showAllBubbles ? (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Hide Labels</span>
              </>
            ) : (
              <>
                <MessageSquareOff className="h-3.5 w-3.5" />
                <span>Show Labels</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
