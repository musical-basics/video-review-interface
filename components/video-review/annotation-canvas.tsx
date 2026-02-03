"use client"

import React from "react"

import { useRef, useEffect, useState } from "react"

interface AnnotationCanvasProps {
  isDrawing: boolean
  activeTool: string
  onDrawingComplete?: (paths: Path[]) => void
}

interface Path {
  points: { x: number; y: number }[]
  color: string
}

export function AnnotationCanvas({ isDrawing, activeTool, onDrawingComplete }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [isMouseDown, setIsMouseDown] = useState(false)

  const getToolColor = () => {
    switch (activeTool) {
      case "pen":
        return "#fbbf24" // yellow
      case "arrow":
        return "#22d3ee" // cyan
      case "text":
        return "#f472b6" // pink
      default:
        return "#fbbf24"
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all paths
    paths.forEach((path) => {
      if (path.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = path.color
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(path.points[0].x, path.points[0].y)
      path.points.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    })

    // Draw current path
    if (currentPath.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = getToolColor()
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(currentPath[0].x, currentPath[0].y)
      currentPath.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
  }, [paths, currentPath, activeTool])

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    // Scale mouse position to match internal canvas dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === "pointer") return
    setIsMouseDown(true)
    const coords = getCanvasCoordinates(e)
    setCurrentPath([coords])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown || !isDrawing || activeTool === "pointer") return
    const coords = getCanvasCoordinates(e)
    setCurrentPath((prev) => [...prev, coords])
  }

  const handleMouseUp = () => {
    if (currentPath.length > 1) {
      const newPath = { points: currentPath, color: getToolColor() }
      setPaths((prev) => [...prev, newPath])
      onDrawingComplete?.([...paths, newPath])
    }
    setCurrentPath([])
    setIsMouseDown(false)
  }

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className={`absolute inset-0 w-full h-full ${
        isDrawing && activeTool !== "pointer" ? "cursor-crosshair" : "pointer-events-none"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}
