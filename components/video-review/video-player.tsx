"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface VideoPlayerProps {
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onPlayPause: () => void
  src: string | null
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void
  stepFrame: (direction: "forward" | "backward") => void
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ currentTime, isPlaying, onTimeUpdate, onDurationChange, onPlayPause, src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    // ... useImperativeHandle logic remains the same ...
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time
        }
      },
      stepFrame: (direction: "forward" | "backward") => {
        if (videoRef.current) {
          const frameTime = 1 / 30 // Assuming 30fps
          videoRef.current.currentTime += direction === "forward" ? frameTime : -frameTime
        }
      },
    }))

    // ... useEffect logic remains the same ...
    useEffect(() => {
      if (videoRef.current) {
        if (isPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.error("Playback failed", e))
        } else if (!isPlaying && !videoRef.current.paused) {
          videoRef.current.pause()
        }
      }
    }, [isPlaying])

    return (
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
        onClick={onPlayPause}
        crossOrigin="anonymous"
        src={src || ""}
      />
    )
  }
)

VideoPlayer.displayName = "VideoPlayer"
