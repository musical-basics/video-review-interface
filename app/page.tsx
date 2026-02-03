"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Video, Calendar, Clock, Image as ImageIcon, File, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface VideoProject {
  id: string
  filename: string
  status: string
  created_at: string
}

interface Asset {
  id: string
  filename: string
  r2_key: string
  media_type: string // 'image' | 'video'
  created_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingAssets, setLoadingAssets] = useState(true)

  // Asset Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      // If table doesn't exist yet, just ignore or log generic error
      console.error("Error fetching assets:", error)
    } finally {
      setLoadingAssets(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchAssets()
  }, [])

  // --- Asset Upload Logic ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // 1. Get Presigned URL
      const response = await fetch("/api/upload-url", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { url, key } = await response.json()

      // 2. Upload to R2
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      // 3. Determine media type
      const mediaType = file.type.startsWith("image") ? "image" : "video"

      // 4. Save to Supabase (assets table)
      const { data, error } = await supabase
        .from("assets")
        .insert({
          filename: file.name,
          r2_key: key,
          media_type: mediaType,
        })
        .select()
        .single()

      if (error) throw error

      // 5. Refresh List
      setAssets(prev => [data, ...prev])

    } catch (error) {
      console.error("Asset upload failed:", error)
      alert("Failed to upload asset.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    // Optimistic update
    setAssets(prev => prev.filter(a => a.id !== id))

    const { error } = await supabase.from("assets").delete().eq("id", id)
    if (error) {
      console.error("Error deleting asset:", error)
      fetchAssets() // Revert on error
    }
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and assets
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="assets">Assets Library</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border rounded-lg bg-muted/10 border-dashed">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <Link href="/upload">
                <Button variant="link">Create your first project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/editor/${project.id}`}>
                  <Card className="h-full overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                    <div className="aspect-video bg-muted/50 flex items-center justify-center relative group-hover:bg-muted/70 transition-colors">
                      <Video className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-medium truncate" title={project.filename}>
                        {project.filename}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center text-xs text-muted-foreground mt-2 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(project.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center capitalize">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${project.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          {project.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-8">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading ? "opacity-50 pointer-events-none" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("asset-upload")?.click()}
          >
            <input
              id="asset-upload"
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                {isUploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {isUploading ? "Uploading..." : "Upload Assets"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag & drop images or videos here, or click to browse
                </p>
              </div>
            </div>
          </div>

          {/* Assets Grid */}
          {loadingAssets ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No assets uploaded yet.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {assets.map((asset) => (
                <div key={asset.id} className="relative group border rounded-md overflow-hidden bg-card">
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {asset.media_type === 'image' ? (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      // In a real app we would show the actual image here using R2 public URL
                    ) : (
                      <Video className="w-8 h-8 text-muted-foreground" />
                    )}

                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAsset(asset.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2 text-xs truncate font-medium">
                    {asset.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
