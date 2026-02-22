'use client'

import { useGEDStore } from '@/store/ged-store'
import { Dashboard } from './dashboard'
import { DocumentsView } from './documents-view'
import { UploadView } from './upload-view'
import { SignaturesView } from './signatures-view'
import { SearchView } from './search-view'
import { AdminView } from './admin-view'
import { AuditView } from './audit-view'
import { BackupView } from './backup-view'
import { ApiKeysView } from './api-keys-view'
import { TasksView } from './tasks-view'
import { cn } from '@/lib/utils'
import { 
  FolderTree, 
  Shield, 
  Settings 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function CategoriesView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categorias</h1>
          <p className="text-slate-500 mt-1">Organize seus documentos em categorias</p>
        </div>
        <Button>
          <FolderTree className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Contratos', 'Jurídico', 'Financeiro', 'RH', 'Comercial', 'Operações'].map((cat, i) => (
          <Card key={cat} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-emerald-600" />
                {cat}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{Math.floor(Math.random() * 500) + 50} documentos</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SecurityView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Segurança</h1>
        <p className="text-slate-500 mt-1">Configurações e monitoramento de segurança</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span>Firewall</span>
              <span className="text-emerald-600 font-medium">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span>Criptografia AES-256</span>
              <span className="text-emerald-600 font-medium">Ativa</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span>Backup Automático</span>
              <span className="text-emerald-600 font-medium">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span>Atualizações de Segurança</span>
              <span className="text-amber-600 font-medium">2 pendentes</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ameaças Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 rounded">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-800">Tentativa de acesso não autorizado</p>
                  <p className="text-sm text-red-600">IP: 192.168.1.200 • Hoje, 13:40</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded">
                  <Shield className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Múltiplas tentativas de login</p>
                  <p className="text-sm text-amber-600">Usuário: carlos@ged.com • Ontem</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Configurações gerais do sistema</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function MainContent() {
  const { currentView, sidebarOpen } = useGEDStore()
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'documents':
        return <DocumentsView />
      case 'upload':
        return <UploadView />
      case 'signatures':
        return <SignaturesView />
      case 'search':
        return <SearchView />
      case 'categories':
        return <CategoriesView />
      case 'admin':
        return <AdminView />
      case 'audit':
        return <AuditView />
      case 'backup':
        return <BackupView />
      case 'apikeys':
        return <ApiKeysView />
      case 'tasks':
        return <TasksView />
      case 'security':
        return <SecurityView />
      case 'settings':
        return <SettingsView />
      default:
        return <Dashboard />
    }
  }
  
  return (
    <main
      className={cn(
        'pt-16 min-h-screen bg-slate-50 transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-16'
      )}
    >
      <div className="p-6">
        {renderView()}
      </div>
    </main>
  )
}
