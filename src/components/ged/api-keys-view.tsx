'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Shield
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string
  rateLimit: number
  active: boolean
  lastUsedAt: string | null
  usageCount: number
  expiresAt: string | null
  description: string | null
  createdAt: string
}

const PERMISSION_OPTIONS = [
  { value: '*', label: 'Acesso Total' },
  { value: 'documents:read', label: 'Ler Documentos' },
  { value: 'documents:write', label: 'Criar/Editar Documentos' },
  { value: 'documents:delete', label: 'Excluir Documentos' },
  { value: 'users:read', label: 'Ler Usuários' },
  { value: 'audit:read', label: 'Ler Auditoria' },
  { value: 'notifications:read', label: 'Ler Notificações' },
]

function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR')
}

export function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    description: '',
    permissions: ['documents:read'],
    rateLimit: 1000,
    expiresInDays: 0
  })
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      alert('Nome é obrigatório')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyData)
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedKey(data.apiKey.key)
        await fetchKeys()
      } else {
        const error = await response.json()
        alert('Erro ao criar API Key: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao criar API Key')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchKeys()
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch('/api/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active })
      })
      await fetchKeys()
    } catch (error) {
      console.error('Error toggling API key:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Chave copiada para a área de transferência!')
  }

  const getPermissionBadge = (perm: string) => {
    const option = PERMISSION_OPTIONS.find(o => o.value === perm)
    return option?.label || perm
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreatedKey(null)
    setShowKey(false)
    setNewKeyData({
      name: '',
      description: '',
      permissions: ['documents:read'],
      rateLimit: 1000,
      expiresInDays: 0
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-500 mt-1">Gerencie chaves de acesso para integrações externas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação API
            </a>
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{createdKey ? 'API Key Criada!' : 'Criar Nova API Key'}</DialogTitle>
                <DialogDescription>
                  {createdKey 
                    ? 'Copie a chave abaixo. Ela não será exibida novamente.'
                    : 'Configure as permissões e limites da nova chave de acesso'}
                </DialogDescription>
              </DialogHeader>

              {createdKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-emerald-800">Sua API Key</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white rounded border text-sm font-mono break-all">
                        {showKey ? createdKey : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Guarde esta chave em local seguro. Ela não será exibida novamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      placeholder="Ex: Integração ERP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newKeyData.description}
                      onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                      placeholder="Descreva o uso desta chave"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Permissões</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PERMISSION_OPTIONS.map((perm) => (
                        <label
                          key={perm.value}
                          className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newKeyData.permissions.includes(perm.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (perm.value === '*') {
                                  setNewKeyData({ ...newKeyData, permissions: ['*'] })
                                } else {
                                  setNewKeyData({
                                    ...newKeyData,
                                    permissions: [...newKeyData.permissions.filter(p => p !== '*'), perm.value]
                                  })
                                }
                              } else {
                                setNewKeyData({
                                  ...newKeyData,
                                  permissions: newKeyData.permissions.filter(p => p !== perm.value)
                                })
                              }
                            }}
                          />
                          <span className="text-sm">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rateLimit">Rate Limit (req/hora)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={newKeyData.rateLimit}
                        onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) || 1000 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expires">Expira em (dias, 0 = nunca)</Label>
                      <Input
                        id="expires"
                        type="number"
                        value={newKeyData.expiresInDays}
                        onChange={(e) => setNewKeyData({ ...newKeyData, expiresInDays: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                {createdKey ? (
                  <Button onClick={closeCreateDialog}>Fechar</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeCreateDialog}>Cancelar</Button>
                    <Button onClick={handleCreateKey} disabled={creating}>
                      {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Criar Key
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Chaves de Acesso</CardTitle>
          <CardDescription>Lista de todas as API Keys ativas e inativas</CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Key className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhuma API Key encontrada</p>
              <p className="text-sm mt-1">Clique em "Nova API Key" para criar a primeira</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${key.active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <Key className={`h-6 w-6 ${key.active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{key.name}</p>
                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{key.keyPrefix}</code>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span>{key.rateLimit} req/h</span>
                        <span>•</span>
                        <span>{key.usageCount} usos</span>
                        {key.expiresAt && (
                          <>
                            <span>•</span>
                            <span>Expira: {formatDate(key.expiresAt)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {JSON.parse(key.permissions).map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {getPermissionBadge(perm)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.active}
                        onCheckedChange={(checked) => handleToggleActive(key.id, checked)}
                      />
                      <Badge variant={key.active ? 'default' : 'secondary'}>
                        {key.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a API Key "{key.name}"?
                            Esta ação não pode ser desfeita e quebrará qualquer integração que use esta chave.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteKey(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingId === key.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
