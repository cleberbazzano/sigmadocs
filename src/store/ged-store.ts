import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER'
  department: string | null
  avatar: string | null
}

export interface Document {
  id: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  mimeType: string
  status: 'DRAFT' | 'PENDING' | 'SIGNED' | 'APPROVED' | 'ARCHIVED' | 'EXPIRED' | 'CANCELLED'
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET'
  categoryId: string | null
  typeName: string | null
  authorName: string
  createdAt: string
  updatedAt: string
  signedAt: string | null
  isSigned: boolean
  signatures: Signature[]
}

export interface Signature {
  id: string
  userName: string
  signedAt: string
  certificateCn: string
  valid: boolean
}

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  documentCount: number
  children: Category[]
}

interface GEDState {
  // Usuário atual
  user: User | null
  isAuthenticated: boolean
  
  // Documentos
  documents: Document[]
  currentDocument: Document | null
  searchQuery: string
  filters: {
    status: string | null
    category: string | null
    confidentiality: string | null
    dateFrom: string | null
    dateTo: string | null
  }
  
  // Categorias
  categories: Category[]
  
  // UI State
  sidebarOpen: boolean
  currentView: 'dashboard' | 'documents' | 'upload' | 'search' | 'admin' | 'audit' | 'categories' | 'signatures' | 'security' | 'settings' | 'company' | 'reports' | 'scan' | 'backup' | 'apikeys' | 'tasks'
  
  // Ações
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  setDocuments: (documents: Document[]) => void
  setCurrentDocument: (doc: Document | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<GEDState['filters']>) => void
  setCategories: (categories: Category[]) => void
  setSidebarOpen: (open: boolean) => void
  setCurrentView: (view: GEDState['currentView']) => void
}

export const useGEDStore = create<GEDState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      documents: [],
      currentDocument: null,
      searchQuery: '',
      filters: {
        status: null,
        category: null,
        confidentiality: null,
        dateFrom: null,
        dateTo: null
      },
      categories: [],
      sidebarOpen: true,
      currentView: 'dashboard',
      
      // Ações
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (e) {
          console.error('Erro ao fazer logout:', e)
        }
        set({ user: null, isAuthenticated: false })
      },
      setDocuments: (documents) => set({ documents }),
      setCurrentDocument: (doc) => set({ currentDocument: doc }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      setCategories: (categories) => set({ categories }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentView: (view) => set({ currentView: view })
    }),
    {
      name: 'ged-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)
