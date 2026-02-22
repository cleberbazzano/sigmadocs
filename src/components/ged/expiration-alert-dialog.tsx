'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExpiringDocument {
  id: string
  title: string
  documentNumber?: string | null
  expirationDate: string
  daysUntilExpiration: number
  status: string
  category?: { id: string; name: string } | null
  author: { id: string; name: string; email: string }
  hasAlert: boolean
  alertStatus: string | null
  alertAcknowledged: boolean
}

interface ExpirationAlertPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ExpirationAlertPopup({ isOpen, onClose }: ExpirationAlertPopupProps) {
  const [documents, setDocuments] = useState<{
    expired: ExpiringDocument[]
    expiring: ExpiringDocument[]
    upcoming: ExpiringDocument[]
  }>({ expired: [], expiring: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/documents/expiring?days=30')
      if (response.ok) {
        const data = await response.json()
        setDocuments({
          expired: data.expired || [],
          expiring: data.expiring || [],
          upcoming: data.upcoming || []
        })
        
        // Pre-select all expired and expiring documents that are not acknowledged
        const toSelect = [
          ...(data.expired || []),
          ...(data.expiring || [])
        ].filter((d: ExpiringDocument) => !d.alertAcknowledged)
        setSelectedDocs(new Set(toSelect.map((d: ExpiringDocument) => d.id)))
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async () => {
    if (selectedDocs.size === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos um documento'
      })
      return
    }

    setMarkingAsRead(true)
    try {
      // Buscar notificações
      const notifResponse = await fetch('/api/notifications')
      const notifData = await notifResponse.json()
      
      // Filtrar notificações dos documentos selecionados
      const notificationIds = (notifData.notifications || [])
        .filter((n: any) => {
          const metadata = n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : {}
          return selectedDocs.has(metadata.documentId) && !n.read
        })
        .map((n: any) => n.id)

      // Marcar notificações como lidas
      if (notificationIds.length > 0) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds })
        })
      }

      // Atualizar estado local imediatamente
      setDocuments(prev => ({
        expired: prev.expired.map(d => 
          selectedDocs.has(d.id) ? { ...d, alertAcknowledged: true } : d
        ),
        expiring: prev.expiring.map(d => 
          selectedDocs.has(d.id) ? { ...d, alertAcknowledged: true } : d
        ),
        upcoming: prev.upcoming
      }))

      // Limpar seleção
      setSelectedDocs(new Set())

      toast({
        title: 'Sucesso',
        description: `${selectedDocs.size} documento(s) marcado(s) como lido(s)`
      })

      // Verificar se ainda há alertas não reconhecidos
      const stillHasUnacknowledged = 
        documents.expired.some(d => !d.alertAcknowledged && !selectedDocs.has(d.id)) ||
        documents.expiring.some(d => !d.alertAcknowledged && !selectedDocs.has(d.id))

      // Se não houver mais alertas, fechar automaticamente após 1 segundo
      if (!stillHasUnacknowledged) {
        setTimeout(() => {
          onClose()
        }, 1000)
      }

    } catch (error) {
      console.error('Error marking as read:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao marcar documentos como lidos',
        variant: 'destructive'
      })
    } finally {
      setMarkingAsRead(false)
    }
  }

  const toggleSelection = (docId: string) => {
    const newSelection = new Set(selectedDocs)
    if (newSelection.has(docId)) {
      newSelection.delete(docId)
    } else {
      newSelection.add(docId)
    }
    setSelectedDocs(newSelection)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Permitir fechar sem problemas
      onClose()
    }
  }

  const renderDocumentList = (
    docs: ExpiringDocument[],
    title: string,
    icon: React.ReactNode,
    bgColor: string,
    borderColor: string
  ) => {
    if (docs.length === 0) return null

    return (
      <div className={`p-4 rounded-lg ${bgColor} border ${borderColor}`}>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary">{docs.length}</Badge>
        </div>
        <div className="space-y-2">
          {docs.map(doc => (
            <div
              key={doc.id}
              className={`flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg ${
                doc.alertAcknowledged ? 'opacity-60' : ''
              }`}
            >
              <Checkbox
                checked={selectedDocs.has(doc.id)}
                onCheckedChange={() => toggleSelection(doc.id)}
                disabled={doc.alertAcknowledged}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="font-medium truncate">{doc.title}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-500">
                  {doc.documentNumber && (
                    <span>Nº {doc.documentNumber}</span>
                  )}
                  {doc.category && (
                    <Badge variant="outline" className="text-xs">
                      {doc.category.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3" />
                  <span className={`text-sm ${
                    doc.daysUntilExpiration < 0 ? 'text-red-600 font-medium' : 
                    doc.daysUntilExpiration <= 7 ? 'text-amber-600 font-medium' : 
                    'text-slate-500'
                  }`}>
                    {doc.daysUntilExpiration < 0 
                      ? `Venceu há ${Math.abs(doc.daysUntilExpiration)} dia(s)`
                      : doc.daysUntilExpiration === 0
                        ? 'Vence hoje!'
                        : `Vence em ${doc.daysUntilExpiration} dia(s)`
                    }
                  </span>
                </div>
                {doc.alertAcknowledged && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Alerta reconhecido</span>
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-slate-500">
                {format(new Date(doc.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalAlerts = documents.expired.length + documents.expiring.length
  const hasUnacknowledged = [...documents.expired, ...documents.expiring]
    .some(d => !d.alertAcknowledged)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Vencimento
          </DialogTitle>
          <DialogDescription>
            Documentos que estão próximos do vencimento ou já vencidos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : totalAlerts === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Nenhum alerta pendente</h3>
            <p className="text-slate-500 mt-2">
              Todos os documentos estão dentro do prazo
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 max-h-[50vh]">
            <div className="space-y-4">
              {renderDocumentList(
                documents.expired,
                'Documentos Vencidos',
                <XCircle className="h-5 w-5 text-red-500" />,
                'bg-red-50 dark:bg-red-900/10',
                'border-red-200 dark:border-red-800'
              )}
              {renderDocumentList(
                documents.expiring,
                'Vencimento Próximo (7 dias)',
                <AlertTriangle className="h-5 w-5 text-amber-500" />,
                'bg-amber-50 dark:bg-amber-900/10',
                'border-amber-200 dark:border-amber-800'
              )}
              {renderDocumentList(
                documents.upcoming,
                'Próximos 30 dias',
                <Clock className="h-5 w-5 text-blue-500" />,
                'bg-blue-50 dark:bg-blue-900/10',
                'border-blue-200 dark:border-blue-800'
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {hasUnacknowledged && (
            <Button 
              onClick={handleMarkAsRead}
              disabled={selectedDocs.size === 0 || markingAsRead}
            >
              {markingAsRead ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Lido ({selectedDocs.size})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
