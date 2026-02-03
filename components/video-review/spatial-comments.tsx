"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Comment {
  id: number
  time: number
  text: string
  type: string
  x?: number
  y?: number
  author: {
    name: string
    avatar: string
    initials: string
  }
}

interface SpatialCommentsProps {
  comments: Comment[]
  currentTime: number
  onCommentClick: (comment: Comment) => void
}

export function SpatialComments({ comments, currentTime, onCommentClick }: SpatialCommentsProps) {
  // Show comments that are within 2 seconds of current time and have spatial coordinates
  const visibleComments = comments.filter(
    (c) => c.x !== undefined && c.y !== undefined && Math.abs(c.time - currentTime) < 2
  )

  return (
    <TooltipProvider>
      <div className="absolute inset-0 pointer-events-none">
        {visibleComments.map((comment) => (
          <Tooltip key={comment.id}>
            <TooltipTrigger asChild>
              <button
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110"
                style={{
                  left: `${comment.x}%`,
                  top: `${comment.y}%`,
                }}
                onClick={() => onCommentClick(comment)}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-marker-yellow/30 rounded-full animate-ping" />
                  <Avatar className="h-8 w-8 border-2 border-marker-yellow ring-2 ring-marker-yellow/50">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                    <AvatarFallback className="bg-marker-yellow text-background text-xs font-medium">
                      {comment.author.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-popover border-border">
              <p className="font-medium text-foreground">{comment.author.name}</p>
              <p className="text-sm text-muted-foreground">{comment.text}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
