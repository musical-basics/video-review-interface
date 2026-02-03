import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  Link2,
  Pencil,
  Type,
  Clock,
  Send,
  Paperclip,
  MoreVertical,
  Trash2,
  X,
  Check
} from "lucide-react"

interface Comment {
  id: number
  time: number
  text: string
  type: string
  link?: string
  x?: number
  y?: number
  author: {
    name: string
    avatar: string
    initials: string
  }
}

interface CommentsSidebarProps {
  comments: Comment[]
  currentTime: number
  onCommentClick: (comment: Comment) => void
  showCommentInput: boolean
  onAddComment: (text: string, link?: string) => void
  onCloseInput: () => void
  onDeleteComment?: (id: number) => void
  onEditComment?: (id: number, newText: string) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "drawing":
      return <Pencil className="h-3 w-3" />
    case "replacement":
      return <Link2 className="h-3 w-3" />
    case "text":
      return <Type className="h-3 w-3" />
    default:
      return <MessageSquare className="h-3 w-3" />
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "drawing":
      return "bg-marker-yellow/20 text-marker-yellow border-marker-yellow/30"
    case "replacement":
      return "bg-marker-cyan/20 text-marker-cyan border-marker-cyan/30"
    case "text":
      return "bg-marker-pink/20 text-marker-pink border-marker-pink/30"
    default:
      return "bg-marker-green/20 text-marker-green border-marker-green/30"
  }
}

export function CommentsSidebar({
  comments,
  currentTime,
  onCommentClick,
  showCommentInput,
  onAddComment,
  onCloseInput,
  onDeleteComment,
  onEditComment,
}: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState("")
  const [attachLink, setAttachLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const sortedComments = [...comments].sort((a, b) => a.time - b.time)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment, attachLink ? linkUrl : undefined)
      setNewComment("")
      setLinkUrl("")
      setAttachLink(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditText(comment.text)
  }

  const saveEdit = (id: number) => {
    if (editText.trim() && onEditComment) {
      onEditComment(id, editText)
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Comments</h2>
          <Badge variant="secondary" className="text-xs">
            {comments.length}
          </Badge>
        </div>
      </div>

      {/* Comment input */}
      {showCommentInput && (
        <div className="p-4 border-b border-border bg-secondary/30">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-primary">
                @{formatTime(currentTime)}
              </span>
            </div>
            <Input
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2 bg-input border-border"
              autoFocus
            />
            {attachLink && (
              <Input
                placeholder="Paste clip URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mb-2 bg-input border-border text-sm"
              />
            )}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`text-muted-foreground hover:text-foreground ${attachLink ? "text-primary" : ""
                  }`}
                onClick={() => setAttachLink(!attachLink)}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach Link
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCloseInput}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors mb-1 group relative"
            >
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => onCommentClick(comment)}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={comment.author.avatar || "/placeholder.svg"}
                    alt={comment.author.name}
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {comment.author.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {comment.author.name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors">
                      {formatTime(comment.time)}
                    </span>
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 w-7 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(comment.id)} className="h-7 w-7 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground line-clamp-2 pr-6">
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTypeBadgeColor(comment.type)}`}
                        >
                          {getTypeIcon(comment.type)}
                          <span className="ml-1 capitalize">{comment.type}</span>
                        </Badge>
                        {comment.link && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-marker-cyan/10 text-marker-cyan border-marker-cyan/30"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            {comment.link.split('/').pop()}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Menu - Only show if not editing */}
              {editingId !== comment.id && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(comment)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeleteComment?.(comment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
