'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GitBranch,
  Play,
  Check,
  X,
  Plus,
  Loader2,
  User,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface ApprovalStep {
  id: string
  stepNumber: number
  name: string
  userId: string | null
  roleId: string | null
  status: string
  approvedAt: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null
  comments: string | null
  approver?: {
    id: string
    name: string
    email: string
  } | null
}

interface ApprovalWorkflow {
  id: string
  name: string
  description: string | null
  type: 'SEQUENTIAL' | 'PARALLEL' | 'ANY'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  currentStep: number
  totalSteps: number
  startedAt: string | null
  completedAt: string | null
  steps: ApprovalStep[]
}

interface WorkflowPanelProps {
  documentId: string
  isAuthor: boolean
  userRole: string
  userId: string
}

function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR')
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof Check }> = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pendente', icon: Clock },
  approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Aprovado', icon: Check },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado', icon: X },
  skipped: { color: 'bg-slate-100 text-slate-700', label: 'Ignorado', icon: ChevronRight },
}

const WORKFLOW_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'bg-slate-100 text-slate-700', label: 'Rascunho' },
  ACTIVE: { color: 'bg-blue-100 text-blue-700', label: 'Em Andamento' },
  COMPLETED: { color: 'bg-emerald-100 text-emerald-700', label: 'Concluído' },
  CANCELLED: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
}

export function WorkflowPanel({ documentId, isAuthor, userRole, userId }: WorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  // New workflow form
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    type: 'SEQUENTIAL' as 'SEQUENTIAL' | 'PARALLEL' | 'ANY',
    steps: [{ name: '', userId: '', roleId: '' }]
  })

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow`)
      if (response.ok) {
        const data = await response.json()
        setWorkflow(data.workflow)
      }
    } catch (error) {
      console.error('Error fetching workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflow()
  }, [documentId])

  const handleStartWorkflow = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })

      if (response.ok) {
        await fetchWorkflow()
      }
    } catch (error) {
      console.error('Error starting workflow:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (stepId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', stepId, comments })
      })

      if (response.ok) {
        setComments('')
        await fetchWorkflow()
      }
    } catch (error) {
      console.error('Error approving:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedStepId || !rejectionReason.trim()) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          stepId: selectedStepId, 
          rejectionReason,
          comments 
        })
      })

      if (response.ok) {
        setRejectionReason('')
        setComments('')
        setSelectedStepId(null)
        setRejectDialogOpen(false)
        await fetchWorkflow()
      }
    } catch (error) {
      console.error('Error rejecting:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || newWorkflow.steps.some(s => !s.name)) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow)
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setNewWorkflow({
          name: '',
          description: '',
          type: 'SEQUENTIAL',
          steps: [{ name: '', userId: '', roleId: '' }]
        })
        await fetchWorkflow()
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const canApproveStep = (step: ApprovalStep) => {
    if (step.status !== 'pending') return false
    if (userRole === 'ADMIN') return true
    if (step.userId === userId) return true
    if (step.roleId === userRole) return true
    return false
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  // No workflow exists
  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" />
            Workflow de Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthor ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Workflow de Aprovação</DialogTitle>
                  <DialogDescription>
                    Configure as etapas de aprovação para este documento
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Workflow</Label>
                    <Input
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="Ex: Aprovação de Contrato"
                    />
                  </div>
                  
                  <div>
                    <Label>Tipo de Fluxo</Label>
                    <Select
                      value={newWorkflow.type}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEQUENTIAL">Sequencial (um por vez)</SelectItem>
                        <SelectItem value="PARALLEL">Paralelo (todos ao mesmo tempo)</SelectItem>
                        <SelectItem value="ANY">Qualquer um (primeiro que aprovar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Etapas</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewWorkflow({
                          ...newWorkflow,
                          steps: [...newWorkflow.steps, { name: '', userId: '', roleId: '' }]
                        })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newWorkflow.steps.map((step, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={step.name}
                            onChange={(e) => {
                              const newSteps = [...newWorkflow.steps]
                              newSteps[index] = { ...step, name: e.target.value }
                              setNewWorkflow({ ...newWorkflow, steps: newSteps })
                            }}
                            placeholder={`Etapa ${index + 1}`}
                            className="flex-1"
                          />
                          <Select
                            value={step.roleId}
                            onValueChange={(value) => {
                              const newSteps = [...newWorkflow.steps]
                              newSteps[index] = { ...step, roleId: value, userId: '' }
                              setNewWorkflow({ ...newWorkflow, steps: newSteps })
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MANAGER">Gerente</SelectItem>
                              <SelectItem value="USER">Usuário</SelectItem>
                            </SelectContent>
                          </Select>
                          {newWorkflow.steps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNewWorkflow({
                                  ...newWorkflow,
                                  steps: newWorkflow.steps.filter((_, i) => i !== index)
                                })
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateWorkflow} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Criar Workflow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-slate-500 text-center">
              Nenhum workflow configurado
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const workflowStatus = WORKFLOW_STATUS_CONFIG[workflow.status] || WORKFLOW_STATUS_CONFIG.DRAFT

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" />
            {workflow.name}
          </CardTitle>
          <Badge className={workflowStatus.color}>
            {workflowStatus.label}
          </Badge>
        </div>
        {workflow.description && (
          <p className="text-sm text-slate-500">{workflow.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Button */}
        {workflow.status === 'DRAFT' && isAuthor && (
          <Button className="w-full" onClick={handleStartWorkflow} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Iniciar Workflow
          </Button>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {workflow.steps.map((step, index) => {
            const stepStatus = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending
            const StepIcon = stepStatus.icon
            const isActive = workflow.status === 'ACTIVE' && 
              ((workflow.type === 'SEQUENTIAL' && step.stepNumber === workflow.currentStep) ||
               (workflow.type !== 'SEQUENTIAL' && step.status === 'pending'))
            const canApprove = canApproveStep(step)

            return (
              <div
                key={step.id}
                className={`p-3 border rounded-lg ${isActive ? 'border-blue-300 bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${stepStatus.color}`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{step.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Etapa {step.stepNumber}
                        </Badge>
                      </div>
                      {step.approver && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {step.approver.name}
                        </div>
                      )}
                      {step.status === 'approved' && step.approvedAt && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Aprovado em {formatDate(step.approvedAt)}
                        </p>
                      )}
                      {step.status === 'rejected' && step.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Motivo: {step.rejectionReason}
                        </p>
                      )}
                      {step.comments && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          "{step.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {canApprove && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(step.id)}
                        disabled={actionLoading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedStepId(step.id)
                          setRejectDialogOpen(true)
                        }}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment input for approvers */}
                {canApprove && (
                  <div className="mt-3">
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Adicione um comentário (opcional)"
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Completion Info */}
        {workflow.status === 'COMPLETED' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 font-medium">
              ✓ Documento aprovado em {formatDate(workflow.completedAt)}
            </p>
          </div>
        )}

        {workflow.status === 'CANCELLED' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              ✗ Workflow cancelado
            </p>
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Rejeitar Documento
              </DialogTitle>
              <DialogDescription>
                A rejeição cancelará todo o workflow. O documento voltará para rascunho.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Justificativa *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da rejeição..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
