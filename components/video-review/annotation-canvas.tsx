"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"

// --- 1. Data Structure Definitions ---
type Point = { x: number; y: number }

type AnnotationType = { id: string } & (
  | { type: 'freehand'; points: Point[]; color: string }
  | { type: 'arrow'; start: Point; end: Point; color: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; color: string; label?: string }
  | { type: 'text'; x: number; y: number; content: string; color: string; fontSize: number }
)

interface AnnotationCanvasProps {
  isDrawing: boolean
  activeTool: string
  onDrawingComplete?: (annotations: AnnotationType[]) => void
}

// --- Helper Functions ---
function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

function distanceToLineSegment(p: Point, v: Point, w: Point) {
  const l2 = Math.pow(getDistance(v, w), 2);
  if (l2 === 0) return getDistance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return getDistance(p, projection);
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

  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [dragStartMouse, setDragStartMouse] = useState<Point | null>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)

  // Text Editing State
  const [editingText, setEditingText] = useState<{ id?: string; x: number; y: number; value: string } | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  const getToolColor = () => {
    switch (activeTool) {
      case "pen": return "#fbbf24" // yellow
      case "arrow": return "#22d3ee" // cyan
      case "text": return "#f472b6" // pink
      case "zoom": return "#a3e635" // lime green
      default: return "#fbbf24"
    }
  }

  // HIT DETECTION
  const getAnnotationAtPosition = useCallback((x: number, y: number, currentAnnotations: AnnotationType[]) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const width = canvas.width
    const height = canvas.height

    // Valid hit distance (pixels)
    const HIT_TOLERANCE = 10

    // Iterate reverse (top to bottom)
    for (let i = currentAnnotations.length - 1; i >= 0; i--) {
      const ann = currentAnnotations[i]

      if (ann.type === 'rect') {
        const ax = ann.x * width
        const ay = ann.y * height
        const aw = ann.width * width
        const ah = ann.height * height
        if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
          return ann.id
        }
      }
      else if (ann.type === 'text') {
        // Approximate text bounds
        const tx = ann.x * width
        const ty = ann.y * height
        // Assume height ~fontSize * 1.5, width ~ char count * fontSize * 0.6
        const tw = ann.content.length * (ann.fontSize * 0.6)
        const th = ann.fontSize * 1.5
        if (x >= tx && x <= tx + tw && y >= ty && y <= ty + th) {
          return ann.id
        }
      }
      else if (ann.type === 'arrow') {
        const start = { x: ann.start.x * width, y: ann.start.y * height }
        const end = { x: ann.end.x * width, y: ann.end.y * height }
        if (distanceToLineSegment({ x, y }, start, end) < HIT_TOLERANCE) {
          return ann.id
        }
      }
      else if (ann.type === 'freehand') {
        // Bounding box check first for performance
        const xs = ann.points.map(p => p.x * width)
        const ys = ann.points.map(p => p.y * height)
        const minX = Math.min(...xs) - HIT_TOLERANCE
        const maxX = Math.max(...xs) + HIT_TOLERANCE
        const minY = Math.min(...ys) - HIT_TOLERANCE
        const maxY = Math.max(...ys) + HIT_TOLERANCE

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return ann.id // Return hit on bounding box for MVP
        }
      }
    }
    return null
  }, [])

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
    annotations.forEach((ann) => {
      ctx.beginPath()
      ctx.strokeStyle = ann.color
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.setLineDash([]) // Reset dash

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

    // 2C. Draw Interaction Preview (Raw Pixels)
    if (isMouseDown && (currentStart || currentFreehandPath.length > 0) && !draggingId) {
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

  }, [annotations, currentStart, currentEnd, currentFreehandPath, activeTool, draggingId])

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
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing && activeTool === "pointer") return // Pointer acts as no-op unless interacting?
    // Actually pointer can select. Hand can grab. Eraser can delete.

    const coords = getCanvasCoords(e)
    setIsMouseDown(true)

    // ERASER
    if (activeTool === "eraser") {
      const hitId = getAnnotationAtPosition(coords.x, coords.y, annotations)
      if (hitId) {
        const updated = annotations.filter(a => a.id !== hitId)
        setAnnotations(updated)
        onDrawingComplete?.(updated)
      }
      return
    }

    // HAND (GRAB)
    if (activeTool === "hand") {
      const hitId = getAnnotationAtPosition(coords.x, coords.y, annotations)
      if (hitId) {
        setDraggingId(hitId)
        setDragStartMouse(coords)
        const ann = annotations.find(a => a.id === hitId)!

        // NOTE: We don't need detailed dragOffset for everything, 
        // we will just calc delta from MouseDown to MouseMove
        // and apply to the ORIGINAL position.
      }
      return // Skip drawing logic
    }

    // DRAWING TOOLS
    if (activeTool === "text") {
      setEditingText({ id: `text-${Date.now()}`, x: coords.x, y: coords.y, value: "" })
      setTimeout(() => textInputRef.current?.focus(), 10)
    } else if (activeTool === "pen") {
      setCurrentFreehandPath([coords])
    } else {
      setCurrentStart(coords)
      setCurrentEnd(coords)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e)

    // HAND DRAGGING
    if (activeTool === "hand" && draggingId && dragStartMouse && isMouseDown) {
      const canvas = canvasRef.current
      if (!canvas) return

      const deltaX = (coords.x - dragStartMouse.x) / canvas.width // Normalized
      const deltaY = (coords.y - dragStartMouse.y) / canvas.height // Normalized

      // Update dragStartMouse to current to avoid compounding acceleration if we added delta
      // efficiently, we'll just move it by the step.
      // Actually typically: newPos = originalPos + (currMouse - startMouse)
      // But here we are modifying state in place? 
      // Better: update state incrementally.

      setAnnotations(prevAnns => prevAnns.map(ann => {
        if (ann.id !== draggingId) return ann

        if (ann.type === 'rect') {
          return { ...ann, x: ann.x + deltaX, y: ann.y + deltaY }
        } else if (ann.type === 'text') {
          return { ...ann, x: ann.x + deltaX, y: ann.y + deltaY }
        } else if (ann.type === 'arrow') {
          return {
            ...ann,
            start: { x: ann.start.x + deltaX, y: ann.start.y + deltaY },
            end: { x: ann.end.x + deltaX, y: ann.end.y + deltaY }
          }
        } else if (ann.type === 'freehand') {
          // Deep update points
          return {
            ...ann,
            points: ann.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
          }
        }
        return ann
      }))

      setDragStartMouse(coords) // Reset delta origin
      return
    }

    if (!isMouseDown) return

    // DRAWING TOOLS
    if (activeTool === "pen") {
      setCurrentFreehandPath(prev => [...prev, coords])
    } else if (activeTool === "arrow" || activeTool === "zoom") {
      setCurrentEnd(coords)
    }
  }

  const handleMouseUp = () => {
    if (draggingId) {
      // Finalize drag
      setDraggingId(null)
      setDragStartMouse(null)
      onDrawingComplete?.(annotations)
    }

    setIsMouseDown(false)
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Save Annotation (Normalize)
    let newAnnotation: AnnotationType | null = null
    const width = canvas.width
    const height = canvas.height

    // DRAWING LOGIC...
    if (activeTool === "pen" && currentFreehandPath.length > 1) {
      newAnnotation = {
        id: `pen-${Date.now()}-${uuidv4()}`,
        type: 'freehand',
        points: currentFreehandPath.map(p => ({ x: p.x / width, y: p.y / height })),
        color: getToolColor()
      }
    }
    else if (activeTool === "arrow" && currentStart && currentEnd) {
      newAnnotation = {
        id: `arrow-${Date.now()}-${uuidv4()}`,
        type: 'arrow',
        start: { x: currentStart.x / width, y: currentStart.y / height },
        end: { x: currentEnd.x / width, y: currentEnd.y / height },
        color: getToolColor()
      }
    }
    else if (activeTool === "zoom" && currentStart && currentEnd) {
      const x = Math.min(currentStart.x, currentEnd.x)
      const y = Math.min(currentStart.y, currentEnd.y)
      const w = Math.abs(currentEnd.x - currentStart.x)
      const h = Math.abs(currentEnd.y - currentStart.y)

      if (w > 5 && h > 5) {
        newAnnotation = {
          id: `zoom-${Date.now()}-${uuidv4()}`,
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e)
    const hitId = getAnnotationAtPosition(coords.x, coords.y, annotations)

    if (hitId) {
      const ann = annotations.find(a => a.id === hitId)
      if (ann && ann.type === 'text') {
        // Remove text from canvas, show input
        const tempAnnotations = annotations.filter(a => a.id !== hitId)
        setAnnotations(tempAnnotations)

        // Canvas to Screen
        const canvas = canvasRef.current!
        const sx = ann.x * canvas.width
        const sy = ann.y * canvas.height

        setEditingText({ id: ann.id, x: sx, y: sy, value: ann.content })
        setTimeout(() => textInputRef.current?.focus(), 10)
      }
    }
  }

  const finishTextEdit = () => {
    if (!editingText || !canvasRef.current || !editingText.value.trim()) {
      if (editingText?.id && !editingText.value.trim()) {
        // Deleted if empty
        onDrawingComplete?.(annotations)
      }
      setEditingText(null)
      return
    }

    const { width, height } = canvasRef.current
    const newAnn: AnnotationType = {
      id: editingText.id || `text-${Date.now()}-${uuidv4()}`,
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

  // Calculate actual pixel position for Input overlay
  const getTextOverlayStyle = () => {
    if (!editingText || !containerRef.current || !canvasRef.current) return {};

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
            activeTool === "hand" ? "cursor-grab active:cursor-grabbing pointer-events-auto" :
              activeTool === "eraser" ? "cursor-crosshair pointer-events-auto" :
                activeTool === "text" || activeTool === "pointer" ? "cursor-default pointer-events-auto" :
                  "cursor-crosshair pointer-events-auto"
          }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
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
