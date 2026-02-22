'use client'

// Sigma DOCs - GED System v3.0.1
// Login Screen with Split Design

import { useGEDStore } from '@/store/ged-store'
import { Sidebar } from '@/components/sigma/sidebar'
import { Header } from '@/components/ged/header'
import { MainContent } from '@/components/sigma/main-content'
import { LoginScreen } from '@/components/sigma/login'
import { useEffect, useState } from 'react'

export default function GEDSystem() {
  const { isAuthenticated, setUser } = useGEDStore()
  const [checking, setChecking] = useState(true)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setChecking(false)
      }
    }
    
    checkSession()
  }, [setUser])
  
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Carregando Sigma DOCs...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <LoginScreen />
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <MainContent />
    </div>
  )
}
