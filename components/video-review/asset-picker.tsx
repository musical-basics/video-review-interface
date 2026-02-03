"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, File as FileIcon, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Asset {
    id: string
    filename: string
    r2_key: string
    size: number
    created_at: string
}

interface AssetPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (asset: Asset) => void
}

export function AssetPicker({ open, onOpenChange, onSelect }: AssetPickerProps) {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (open) {
            fetchAssets()
        }
    }, [open])

    const fetchAssets = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAssets(data || [])
        } catch (error) {
            console.error("Error fetching assets:", error)
            // MOCK DATA FOR DEMO if table doesn't exist yet
            setAssets([
                { id: '1', filename: 'logo-transparent.png', r2_key: 'assets/logo.png', size: 1024, created_at: new Date().toISOString() },
                { id: '2', filename: 'intro-music.mp3', r2_key: 'assets/music.mp3', size: 5000000, created_at: new Date().toISOString() },
                { id: '3', filename: 'brand-guidelines.pdf', r2_key: 'assets/guide.pdf', size: 2048, created_at: new Date().toISOString() },
            ])
        } finally {
            setLoading(false)
        }
    }

    const filteredAssets = assets.filter(a =>
        a.filename.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select an Asset</DialogTitle>
                </DialogHeader>

                <div className="flex items-center space-x-2 my-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                    />
                </div>

                <ScrollArea className="h-[300px] pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No assets found. Upload them in the Dashboard.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="flex items-center p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => onSelect(asset)}
                                >
                                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mr-3">
                                        <FileIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{asset.filename}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(asset.size / 1024).toFixed(1)} KB • {new Date(asset.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
