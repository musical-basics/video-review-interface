export interface Comment {
    id: number
    time: number
    text: string
    type: "general" | "issue" | "praise" | "question" | "replacement" | "text" | "drawing"
    link?: string
    x?: number
    y?: number
    resolved?: boolean
    author: {
        name: string
        avatar: string
        initials: string
    }
}
