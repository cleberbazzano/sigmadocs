'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  Send,
  Check,
  Reply,
  Loader2,
  User,
  Clock
} from 'lucide-react'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  replies: Comment[]
  createdAt: string
}

interface CommentsPanelProps {
  documentId: string
  isAuthor: boolean
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return 'Agora mesmo'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d atrás`
  
  return d.toLocaleDateString('pt-BR')
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function CommentItem({ 
  comment, 
  documentId, 
  isAuthor, 
  onReply,
  onResolve,
  replyToId,
  setReplyToId
}: { 
  comment: Comment
  documentId: string
  isAuthor: boolean
  onReply: (parentId: string, content: string) => Promise<void>
  onResolve: (commentId: string, resolved: boolean) => Promise<void>
  replyToId: string | null
  setReplyToId: (id: string | null) => void
}) {
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setReplying(true)
    await onReply(comment.id, replyContent)
    setReplyContent('')
    setReplyToId(null)
    setReplying(false)
  }

  return (
    <div className={`space-y-2 ${comment.resolved ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className="bg-emerald-600 text-white text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
            {comment.resolved && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                <Check className="h-3 w-3 mr-1" />
                Resolvido
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
            {isAuthor && !comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600"
                onClick={() => onResolve(comment.id, true)}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar como Resolvido
              </Button>
            )}
            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {comment.replies.length} resposta{comment.replies.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {replyToId === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="min-h-[60px] text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleReply}
                disabled={replying || !replyContent.trim()}
              >
                {replying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-slate-200 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.author.avatar} />
                    <AvatarFallback className="bg-slate-600 text-white text-xs">
                      {getInitials(reply.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{reply.author.name}</span>
                      <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentsPanel({ documentId, isAuthor }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [includeResolved, setIncludeResolved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments?includeResolved=${includeResolved}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [documentId, includeResolved])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        await fetchComments()
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId })
      })

      if (response.ok) {
        await fetchComments()
      }
    } catch (error) {
      console.error('Error creating reply:', error)
    }
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, resolved })
      })

      if (response.ok) {
        await fetchComments()
      }
    } catch (error) {
      console.error('Error resolving comment:', error)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Comentários
            <Badge variant="secondary" className="ml-2">
              {comments.filter(c => !c.resolved).length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIncludeResolved(!includeResolved)}
          >
            {includeResolved ? 'Ocultar Resolvidos' : 'Mostrar Resolvidos'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* New Comment */}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="min-h-[60px] text-sm"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            className="self-end"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Nenhum comentário ainda</p>
              <p className="text-xs">Seja o primeiro a comentar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  documentId={documentId}
                  isAuthor={isAuthor}
                  onReply={handleReply}
                  onResolve={handleResolve}
                  replyToId={replyToId}
                  setReplyToId={setReplyToId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
