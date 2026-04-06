import { useState, useEffect } from 'react'
import { Users, Building2, Briefcase, Layers } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'
import UsersTab from '../components/organization/UsersTab'
import DirectionsTab from '../components/organization/DirectionsTab'
import DepartmentsTab from '../components/organization/DepartmentsTab'
import SectionsTab from '../components/organization/SectionsTab'

const Organization = () => {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState('')

  // Definir todas as tabs com suas permissões
  const allTabs = [
    { 
      id: 'users', 
      label: 'Utilizadores', 
      icon: Users, 
      component: UsersTab,
      permission: ['client_users', 'view']
    },
    { 
      id: 'directions', 
      label: 'Direções', 
      icon: Building2, 
      component: DirectionsTab,
      permission: ['directions', 'view']
    },
    { 
      id: 'departments', 
      label: 'Departamentos', 
      icon: Briefcase, 
      component: DepartmentsTab,
      permission: ['departments', 'view']
    },
    { 
      id: 'sections', 
      label: 'Secções', 
      icon: Layers, 
      component: SectionsTab,
      permission: ['sections', 'view']
    }
  ]

  // Filtrar tabs baseado em permissões
  const tabs = allTabs.filter(tab => {
    if (!tab.permission) return true
    const [resource, action] = tab.permission
    return can(resource, action)
  })

  // Definir tab ativa inicial (primeira tab com permissão)
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  // Se não há tabs disponíveis, mostrar mensagem
  if (tabs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organização</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir estrutura organizacional e utilizadores
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            Não tem permissões para aceder a nenhuma secção desta página.
          </p>
        </div>
      </div>
    )
  }

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organização</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerir estrutura organizacional e utilizadores
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}

export default Organization
