"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Video, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface VideoProject {
  id: string
  filename: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your video review projects
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border rounded-lg bg-muted/10 border-dashed">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-sm">
            Upload a video to start your first review project.
          </p>
          <Link href="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/editor/${project.id}`}>
              <Card className="h-full overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                <div className="aspect-video bg-muted/50 flex items-center justify-center relative group-hover:bg-muted/70 transition-colors">
                  <Video className="w-10 h-10 text-muted-foreground/50" />
                  {/* Placeholder for thumbnail */}
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
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${project.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      {project.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
