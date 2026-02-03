"use client"

import { useRef } from "react"
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
  Hand,
  Eraser,
  Paperclip,
} from "lucide-react"

interface ActionToolbarProps {
  activeTool: string
  onToolChange: (tool: string) => void
}

const tools = [
  { id: "pointer", icon: MousePointer2, label: "Pointer", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Grab / Move", shortcut: "H" },
  { id: "pen", icon: Pencil, label: "Draw", shortcut: "P" },
  { id: "arrow", icon: MoveUpRight, label: "Arrow", shortcut: "A" },
  { id: "zoom", icon: ZoomIn, label: "Zoom Here", shortcut: "Z" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
  { id: "link", icon: Paperclip, label: "Attach Clip", shortcut: "L" },
]

export function ActionToolbar({ activeTool, onToolChange }: ActionToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToolClick = (toolId: string) => {
    if (toolId === "link") {
      fileInputRef.current?.click()
    } else {
      onToolChange(toolId)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // MOCK UPLOAD LOGIC
    // In production, you would upload this file to R2 here
    // and then call a prop function to add the comment link
    console.log("File selected:", file.name)
    alert(`File selected: ${file.name}\n(Upload logic would trigger here)`)

    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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
                    className={`h-9 w-9 p-0 ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    onClick={() => handleToolClick(tool.id)}
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

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </TooltipProvider>
  )
}
