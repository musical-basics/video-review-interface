"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface VideoPlayerProps {
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onPlayPause: () => void
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void
  stepFrame: (direction: "forward" | "backward") => void
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ currentTime, isPlaying, onTimeUpdate, onDurationChange, onPlayPause }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

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

    useEffect(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.play()
        } else {
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
        poster="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&q=80"
      >
        <source
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          type="video/mp4"
        />
      </video>
    )
  }
)

VideoPlayer.displayName = "VideoPlayer"
