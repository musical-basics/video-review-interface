"use client"

import React, { useRef, useEffect, useState, useMemo } from "react"
import { X } from "lucide-react"

// --- 1. Data Structure Definitions ---
type Point = { x: number; y: number }

type AnnotationType =
  | { type: 'freehand'; points: Point[]; color: string }
  | { type: 'arrow'; start: Point; end: Point; color: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; color: string; label?: string }
  | { type: 'text'; x: number; y: number; content: string; color: string; fontSize: number }

interface AnnotationCanvasProps {
  isDrawing: boolean
  activeTool: string
  onDrawingComplete?: (annotations: AnnotationType[]) => void
}

export function AnnotationCanvas({ isDrawing, activeTool, onDrawingComplete }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Stored annotations (Normalized 0-1)
  const [annotations, setAnnotations] = useState<AnnotationType[]>([])

  // Current interaction state (Raw pixels)
  const [currentStart, setCurrentStart] = useState<Point | null>(null)
  const [currentEnd, setCurrentEnd] = useState<Point | null>(null)
  const [currentFreehandPath, setCurrentFreehandPath] = useState<Point[]>([])

  const [isMouseDown, setIsMouseDown] = useState(false)

  // Text Editing State
  const [editingText, setEditingText] = useState<{ x: number; y: number; value: string } | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Pointer/Delete State
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null)


  const getToolColor = () => {
    switch (activeTool) {
      case "pen": return "#fbbf24" // yellow
      case "arrow": return "#22d3ee" // cyan
      case "text": return "#f472b6" // pink
      case "zoom": return "#a3e635" // lime green
      default: return "#fbbf24"
    }
  }

  // --- 2. Rendering Cycle ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 2A. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const { width, height } = canvas

    // 2B. Draw Saved Annotations (De-normalize)
    annotations.forEach((ann, index) => {
      ctx.beginPath()
      ctx.strokeStyle = ann.color
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.setLineDash([]) // Reset dash

      // Highlight if hovered (Pointer Mode)
      if (activeTool === "pointer" && hoveredAnnotationIndex === index) {
        ctx.strokeStyle = "#ef4444" // Red on hover
        ctx.shadowColor = "rgba(239, 68, 68, 0.5)"
        ctx.shadowBlur = 10
      } else {
        ctx.shadowBlur = 0
      }

      if (ann.type === 'freehand') {
        if (ann.points.length < 2) return
        ctx.moveTo(ann.points[0].x * width, ann.points[0].y * height)
        ann.points.forEach(p => ctx.lineTo(p.x * width, p.y * height))
        ctx.stroke()
      }
      else if (ann.type === 'arrow') {
        const ax = ann.start.x * width
        const ay = ann.start.y * height
        const bx = ann.end.x * width
        const by = ann.end.y * height
        drawArrow(ctx, ax, ay, bx, by)
      }
      else if (ann.type === 'rect') {
        ctx.setLineDash([10, 5])
        const rx = ann.x * width
        const ry = ann.y * height
        const rw = ann.width * width
        const rh = ann.height * height
        ctx.strokeRect(rx, ry, rw, rh)

        // Draw Zoom Label
        if (ann.label) {
          ctx.font = "bold 14px sans-serif"
          ctx.fillStyle = ann.color
          ctx.fillText(ann.label, rx + 5, ry + 20)
        }
      }
      else if (ann.type === 'text') {
        ctx.font = `${ann.fontSize}px sans-serif`
        ctx.fillStyle = ann.color
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText(ann.content, ann.x * width, ann.y * height)
      }
    })

    // Reset Shadow
    ctx.shadowBlur = 0

    // 2C. Draw Interaction Preview (Raw Pixels)
    if (isMouseDown && (currentStart || currentFreehandPath.length > 0)) {
      ctx.beginPath()
      ctx.strokeStyle = getToolColor()
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.setLineDash([])

      if (activeTool === "pen" && currentFreehandPath.length > 1) {
        ctx.moveTo(currentFreehandPath[0].x, currentFreehandPath[0].y)
        currentFreehandPath.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.stroke()
      }
      else if (activeTool === "arrow" && currentStart && currentEnd) {
        drawArrow(ctx, currentStart.x, currentStart.y, currentEnd.x, currentEnd.y)
      }
      else if (activeTool === "zoom" && currentStart && currentEnd) {
        ctx.setLineDash([10, 5])
        const w = currentEnd.x - currentStart.x
        const h = currentEnd.y - currentStart.y
        ctx.strokeRect(currentStart.x, currentStart.y, w, h)
        ctx.font = "bold 14px sans-serif"
        ctx.fillStyle = getToolColor()
        ctx.fillText("ZOOM", currentStart.x + 5, currentStart.y + 20)
      }
    }

  }, [annotations, currentStart, currentEnd, currentFreehandPath, activeTool, hoveredAnnotationIndex])

  // Helper: Draw Arrow
  const drawArrow = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) => {
    // Line
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()

    // Arrowhead
    const angle = Math.atan2(by - ay, bx - ax)
    const headLen = 15
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - headLen * Math.cos(angle - Math.PI / 6), by - headLen * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - headLen * Math.cos(angle + Math.PI / 6), by - headLen * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  // --- 3. Interaction Handlers ---

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    // Maintain 1:1 scale logic with intrinsic size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool === "pointer") return

    const coords = getCanvasCoords(e)
    setIsMouseDown(true)

    if (activeTool === "text") {
      setEditingText({ x: coords.x, y: coords.y, value: "" })
      setTimeout(() => textInputRef.current?.focus(), 10) // Focus next tick
    } else if (activeTool === "pen") {
      setCurrentFreehandPath([coords])
    } else {
      setCurrentStart(coords)
      setCurrentEnd(coords) // Initialize end as start
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e)

    // Pointer Hover Logic (Hit Test)
    if (activeTool === "pointer") {
      // Simple bounding box hit test for now
      // TODO: Refine this for lines
      setHoveredAnnotationIndex(null)
      // This is expensive to do on every move, optimized later if needed
      return
    }

    if (!isMouseDown) return

    if (activeTool === "pen") {
      setCurrentFreehandPath(prev => [...prev, coords])
    } else {
      setCurrentEnd(coords)
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || activeTool === "pointer") return
    setIsMouseDown(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Save Annotation (Normalize)
    let newAnnotation: AnnotationType | null = null
    const width = canvas.width
    const height = canvas.height

    if (activeTool === "pen" && currentFreehandPath.length > 1) {
      newAnnotation = {
        type: 'freehand',
        points: currentFreehandPath.map(p => ({ x: p.x / width, y: p.y / height })),
        color: getToolColor()
      }
    }
    else if (activeTool === "arrow" && currentStart && currentEnd) {
      newAnnotation = {
        type: 'arrow',
        start: { x: currentStart.x / width, y: currentStart.y / height },
        end: { x: currentEnd.x / width, y: currentEnd.y / height },
        color: getToolColor()
      }
    }
    else if (activeTool === "zoom" && currentStart && currentEnd) {
      // Ensure x,y is top-left
      const x = Math.min(currentStart.x, currentEnd.x)
      const y = Math.min(currentStart.y, currentEnd.y)
      const w = Math.abs(currentEnd.x - currentStart.x)
      const h = Math.abs(currentEnd.y - currentStart.y)

      if (w > 5 && h > 5) { // Min size
        newAnnotation = {
          type: 'rect',
          x: x / width,
          y: y / height,
          width: w / width,
          height: h / height,
          color: getToolColor(),
          label: 'ZOOM'
        }
      }
    }

    if (newAnnotation) {
      const updated = [...annotations, newAnnotation]
      setAnnotations(updated)
      onDrawingComplete?.(updated)
    }

    // Reset interaction state
    setCurrentStart(null)
    setCurrentEnd(null)
    setCurrentFreehandPath([])
  }

  const finishTextEdit = () => {
    if (!editingText || !canvasRef.current || !editingText.value.trim()) {
      setEditingText(null)
      return
    }

    const { width, height } = canvasRef.current
    const newAnn: AnnotationType = {
      type: 'text',
      x: editingText.x / width,
      y: editingText.y / height,
      content: editingText.value,
      color: getToolColor(),
      fontSize: 24
    }

    const updated = [...annotations, newAnn]
    setAnnotations(updated)
    onDrawingComplete?.(updated)
    setEditingText(null)
  }

  // Pointer Click (Delete)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool !== "pointer") return;
    // Implement specific click logic here for delete if desired
    // For now, hovering + contextual UI is better or a delete mode
    // This is a placeholder for the "Delete Button" logic requested.
    // Since canvas lacks DOM nodes, we usually check distance to objects.
  }

  // Calculate actual pixel position for Input overlay
  // This needs to map canvas-relative pixels back to screen pixels for the <input>
  const getTextOverlayStyle = () => {
    if (!editingText || !containerRef.current || !canvasRef.current) return {};

    // We need to scale from internal canvas res (1920x1080) to displayed size
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = rect.width / canvasRef.current.width
    const scaleY = rect.height / canvasRef.current.height

    return {
      left: editingText.x * scaleX,
      top: editingText.y * scaleY,
      color: getToolColor()
    }
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" ref={containerRef}>
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className={`w-full h-full ${!isDrawing ? "pointer-events-none" :
            activeTool === "text" || activeTool === "pointer" ? "cursor-default pointer-events-auto" :
              "cursor-crosshair pointer-events-auto"
          }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />

      {/* Text Input Overlay */}
      {editingText && (
        <input
          ref={textInputRef}
          type="text"
          className="absolute bg-transparent border-dashed border border-white/50 outline-none p-1 pointer-events-auto text-2xl font-bold font-sans shadow-sm"
          style={getTextOverlayStyle()}
          value={editingText.value}
          onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
          onBlur={finishTextEdit}
          onKeyDown={(e) => e.key === 'Enter' && finishTextEdit()}
        />
      )}
    </div>
  )
}
