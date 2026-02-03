"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  MousePointer2,
  Pencil,
  MoveUpRight,
  ZoomIn,
  Type,
  Paperclip,
} from "lucide-react"

interface ActionToolbarProps {
  activeTool: string
  onToolChange: (tool: string) => void
}

const tools = [
  { id: "pointer", icon: MousePointer2, label: "Pointer", shortcut: "V" },
  { id: "pen", icon: Pencil, label: "Draw", shortcut: "P" },
  { id: "arrow", icon: MoveUpRight, label: "Arrow", shortcut: "A" },
  { id: "zoom", icon: ZoomIn, label: "Zoom Here", shortcut: "Z" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "link", icon: Paperclip, label: "Attach Clip", shortcut: "L" },
]

export function ActionToolbar({ activeTool, onToolChange }: ActionToolbarProps) {
  return (
    <TooltipProvider>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1.5 shadow-xl">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`h-9 w-9 p-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    onClick={() => onToolChange(tool.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex items-center gap-2">
                  <span>{tool.label}</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
                    {tool.shortcut}
                  </kbd>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
