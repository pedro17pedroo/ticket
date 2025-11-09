import { useState } from 'react'
import { Users, Building2, Briefcase, Layers } from 'lucide-react'
import UsersTab from '../components/organization/UsersTab'
import DirectionsTab from '../components/organization/DirectionsTab'
import DepartmentsTab from '../components/organization/DepartmentsTab'
import SectionsTab from '../components/organization/SectionsTab'

const Organization = () => {
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', label: 'Utilizadores', icon: Users, component: UsersTab },
    { id: 'directions', label: 'Direções', icon: Building2, component: DirectionsTab },
    { id: 'departments', label: 'Departamentos', icon: Briefcase, component: DepartmentsTab },
    { id: 'sections', label: 'Secções', icon: Layers, component: SectionsTab }
  ]

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
