'use client'

import { useGEDStore } from '@/store/ged-store'
import { Dashboard } from '@/components/ged/dashboard'
import { DocumentsView } from '@/components/ged/documents-view'
import { UploadView } from '@/components/ged/upload-view'
import { SignaturesView } from '@/components/ged/signatures-view'
import { SearchView } from '@/components/ged/search-view'
import { AdminView } from '@/components/ged/admin-view'
import { AuditView } from '@/components/ged/audit-view'
import { CompanyView } from '@/components/sigma/company-view'
import { ReportsView } from '@/components/sigma/reports-view'
import { ScanView } from '@/components/sigma/scan-view'
import { SettingsView } from '@/components/ged/settings-view'
import { BackupView } from '@/components/ged/backup-view'
import { ApiKeysView } from '@/components/ged/api-keys-view'
import { TasksView } from '@/components/ged/tasks-view'
import { cn } from '@/lib/utils'
import { 
  FolderTree, 
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function CategoriesView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Categorias</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize seus documentos em categorias</p>
        </div>
        <Button>
          <FolderTree className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Contratos', 'Jurídico', 'Financeiro', 'RH', 'Comercial', 'Operações'].map((cat) => (
          <Card key={cat} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-teal-600" />
                {cat}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400">{Math.floor(Math.random() * 500) + 50} documentos</p>
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Segurança</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configurações e monitoramento de segurança</p>
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
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="dark:text-white">Firewall</span>
              <span className="text-emerald-600 font-medium">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="dark:text-white">Criptografia AES-256</span>
              <span className="text-emerald-600 font-medium">Ativa</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="dark:text-white">Backup Automático</span>
              <span className="text-emerald-600 font-medium">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="dark:text-white">Atualizações de Segurança</span>
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
              <div className="flex items-center gap-3 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="p-2 bg-red-100 dark:bg-red-800 rounded">
                  <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-300">Tentativa de acesso não autorizado</p>
                  <p className="text-sm text-red-600 dark:text-red-400">IP: 192.168.1.200 • Hoje, 13:40</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Múltiplas tentativas de login</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Usuário: carlos@sigmadocs.com • Ontem</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
      case 'scan':
        return <ScanView />
      case 'signatures':
        return <SignaturesView />
      case 'search':
        return <SearchView />
      case 'categories':
        return <CategoriesView />
      case 'company':
        return <CompanyView />
      case 'reports':
        return <ReportsView />
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
        'pt-16 min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-16'
      )}
    >
      <div className="p-6">
        {renderView()}
      </div>
    </main>
  )
}
