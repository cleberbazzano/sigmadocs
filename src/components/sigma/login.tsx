'use client'

import { useState, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, AlertCircle, Loader2, Shield, FileCheck, Archive } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'

interface SystemConfig {
  logoUrl: string
  logoUrlDark: string
  systemName: string
  systemDescription: string
  companyName: string
  companyLogo: string
  version: string
  versionDate: string
  lastUpdate: string
}

export function LoginScreen() {
  const { setUser } = useGEDStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<SystemConfig>({
    logoUrl: '/logo-light.png',
    logoUrlDark: '/logo-dark.png',
    systemName: 'Sigma DOCs',
    systemDescription: 'Sistema de Gestão Eletrônica de Documentos',
    companyName: 'Sigma DOCs',
    companyLogo: '/logo-dark.png',
    version: '3.0.0',
    versionDate: '2025-01-15',
    lastUpdate: 'Correções de segurança e melhorias de performance'
  })

  // Carregar configurações do sistema
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig(prev => ({ ...prev, ...data.config }))
        }
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado Esquerdo - Logo e Descrição */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col justify-center items-center p-8 lg:p-16 min-h-[40vh] lg:min-h-screen relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image 
              src="/logo-sigma.png" 
              alt="Sigma DOCs"
              width={180}
              height={180}
              className="drop-shadow-2xl"
              priority
            />
          </div>
          
          {/* System Name */}
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Sigma
            </span>
            <span className="text-white"> DOCs</span>
          </h1>
          
          {/* Description */}
          <p className="text-slate-300 text-lg lg:text-xl leading-relaxed">
            {config.systemDescription}
          </p>
          
          {/* Features */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-slate-300 text-sm">Segurança Avançada</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <FileCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-slate-300 text-sm">Assinatura Digital</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <Archive className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-slate-300 text-sm">Gestão Completa</span>
            </div>
          </div>
        </div>
        
        {/* Footer Left */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {config.companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
      
      {/* Lado Direito - Login */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col min-h-[60vh] lg:min-h-screen">
        {/* Header com nome da empresa */}
        <div className="p-6 lg:p-8 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold text-slate-800">
                {config.companyName}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Acesse sua conta para continuar
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Ambiente Seguro</span>
            </div>
          </div>
        </div>
        
        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-md">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-11 h-12 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-base font-medium shadow-lg shadow-emerald-500/25 transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : 'Entrar'}
              </Button>
              
              <div className="text-center text-sm text-slate-500 bg-slate-50 rounded-lg p-4">
                <p className="font-medium text-slate-600 mb-1">Credenciais de demonstração:</p>
                <p>admin@sigmadocs.com.br / admin123</p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Footer com versão e atualizações */}
        <div className="p-6 lg:p-8 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="font-medium text-slate-600">v{config.version}</span>
              </span>
              <span className="hidden sm:inline">|</span>
              <span>Atualizado em {new Date(config.versionDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-slate-400">{config.lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
