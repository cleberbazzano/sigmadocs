'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Sun,
  Moon,
  Monitor,
  Upload,
  Trash2,
  Image as ImageIcon,
  Save,
  Loader2,
  Building2,
  Palette
} from 'lucide-react'
import Image from 'next/image'

interface SystemConfig {
  logoUrl: string
  logoUrlDark: string
  faviconUrl: string
  theme: string
  systemName: string
  systemDescription: string
}

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [config, setConfig] = useState<SystemConfig>({
    logoUrl: '/logo-light.png',
    logoUrlDark: '/logo-dark.png',
    faviconUrl: '/logo-dark.png',
    theme: 'system',
    systemName: 'Sigma DOCs',
    systemDescription: 'Sistema de Gestão Eletrônica de Documentos'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoDarkInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Carregar configurações
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config')
        if (response.ok) {
          const data = await response.json()
          setConfig(data.config)
          // Sincronizar tema
          if (data.config.theme) {
            setTheme(data.config.theme)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [setTheme])

  // Upload de arquivo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'logoDark' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(type)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/config/logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const key = type === 'logoDark' ? 'logoUrlDark' : type === 'logo' ? 'logoUrl' : 'faviconUrl'
        setConfig(prev => ({ ...prev, [key]: data.url }))
        toast({
          title: 'Sucesso',
          description: `${type === 'logoDark' ? 'Logo escura' : type === 'logo' ? 'Logo clara' : 'Favicon'} atualizado com sucesso`
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao fazer upload',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setUploading(null)
      // Limpar input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  // Resetar arquivo
  const handleReset = async (type: 'logo' | 'logoDark' | 'favicon') => {
    try {
      const response = await fetch(`/api/config/logo?type=${type}`, { method: 'DELETE' })
      if (response.ok) {
        const key = type === 'logoDark' ? 'logoUrlDark' : type === 'logo' ? 'logoUrl' : 'faviconUrl'
        const defaultValue = key === 'logoUrl' ? '/logo-light.png' : '/logo-dark.png'
        setConfig(prev => ({ ...prev, [key]: defaultValue }))
        toast({
          title: 'Sucesso',
          description: 'Arquivo resetado para o padrão'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao resetar',
        variant: 'destructive'
      })
    }
  }

  // Selecionar tema
  const handleThemeChange = (newTheme: string) => {
    setConfig(prev => ({ ...prev, theme: newTheme }))
    setTheme(newTheme)
  }

  // Salvar configurações
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Configurações salvas com sucesso'
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao salvar',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize o sistema de acordo com sua empresa</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Configure as logos do sistema para fundo claro e escuro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Claro (para fundo escuro) */}
            <div className="space-y-4">
              <Label className="text-base">Logo Clara</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Exibida em fundos escuros (sidebar, tela de login escura)
              </p>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-800 overflow-hidden">
                  {config.logoUrl ? (
                    <Image
                      src={config.logoUrl}
                      alt="Logo Clara"
                      width={88}
                      height={88}
                      className="object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => handleUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading === 'logo'}
                  >
                    {uploading === 'logo' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset('logo')}
                    disabled={config.logoUrl === '/logo-light.png'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>
            </div>

            {/* Logo Escura (para fundo claro) */}
            <div className="space-y-4">
              <Label className="text-base">Logo Escura</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Exibida em fundos claros (tema claro, documentos)
              </p>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                  {config.logoUrlDark ? (
                    <Image
                      src={config.logoUrlDark}
                      alt="Logo Escura"
                      width={88}
                      height={88}
                      className="object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoDarkInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => handleUpload(e, 'logoDark')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoDarkInputRef.current?.click()}
                    disabled={uploading === 'logoDark'}
                  >
                    {uploading === 'logoDark' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset('logoDark')}
                    disabled={config.logoUrlDark === '/logo-dark.png'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-4">
              <Label className="text-base">Favicon</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ícone da aba do navegador
              </p>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  {config.faviconUrl ? (
                    <Image
                      src={config.faviconUrl}
                      alt="Favicon"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                    onChange={(e) => handleUpload(e, 'favicon')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading === 'favicon'}
                  >
                    {uploading === 'favicon' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset('favicon')}
                    disabled={config.faviconUrl === '/logo-dark.png'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Nome e descrição que aparecem no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={config.systemName}
                onChange={(e) => setConfig(prev => ({ ...prev, systemName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemDescription">Descrição</Label>
              <Input
                id="systemDescription"
                value={config.systemDescription}
                onChange={(e) => setConfig(prev => ({ ...prev, systemDescription: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Escolha o tema de cores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                config.theme === 'system'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Monitor className="h-8 w-8" />
              <span className="font-medium">Sistema</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Segue o sistema operacional</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                config.theme === 'light'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Sun className="h-8 w-8" />
              <span className="font-medium">Claro</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tema claro permanente</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                config.theme === 'dark'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Moon className="h-8 w-8" />
              <span className="font-medium">Escuro</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tema escuro permanente</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
