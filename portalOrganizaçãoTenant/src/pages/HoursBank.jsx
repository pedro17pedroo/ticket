import { useState, useEffect } from 'react'
import { Clock, Plus, TrendingUp, TrendingDown, History, X, Save, User, Calendar, FileText, Settings, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'
import TicketSearchSelector from '../components/TicketSearchSelector'
import ProjectSearchSelector from '../components/ProjectSearchSelector'

const HoursBank = () => {
  const [hoursBanks, setHoursBanks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddHoursModal, setShowAddHoursModal] = useState(false)
  const [showConsumeModal, setShowConsumeModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState(null)
  const [transactions, setTransactions] = useState([])

  // Estados de paginação e filtros
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    clientId: '',
    isActive: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    totalHours: '',
    packageType: '',
    startDate: '',
    endDate: '',
    allowNegativeBalance: false,
    minBalance: '',
    notes: ''
  })

  const [hoursData, setHoursData] = useState({
    hours: '',
    description: '',
    ticketId: ''
  })

  // Estados para o modal de consumo melhorado
  const [consumeType, setConsumeType] = useState('ticket') // 'ticket', 'project', 'manual'
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [originalHours, setOriginalHours] = useState(null)
  const [activityName, setActivityName] = useState('')

  useEffect(() => {
    loadData()
  }, [pagination.page, pagination.limit, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      // Construir query params
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (filters.clientId) {
        params.clientId = filters.clientId
      }
      
      if (filters.isActive !== '') {
        params.isActive = filters.isActive
      }

      const [banksRes, clientsRes] = await Promise.all([
        api.get('/hours-banks', { params }),
        api.get('/clients')
      ])
      
      setHoursBanks(banksRes.data.hoursBanks || [])
      setClients(clientsRes.data.clients || [])
      
      // Atualizar paginação se o backend retornar
      if (banksRes.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: banksRes.data.pagination.total,
          totalPages: banksRes.data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar bolsas de horas')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset para primeira página
  }

  const clearFilters = () => {
    setFilters({
      clientId: '',
      isActive: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleCreateBank = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hours-banks', formData)
      toast.success('Bolsa de horas criada com sucesso!')
      setShowCreateModal(false)
      setFormData({
        clientId: '',
        totalHours: '',
        packageType: '',
        startDate: '',
        endDate: '',
        allowNegativeBalance: false,
        minBalance: '',
        notes: ''
      })
      loadData()
    } catch (error) {
      console.error('Erro ao criar bolsa:', error)
      toast.error('Erro ao criar bolsa de horas')
    }
  }

  const handleAddHours = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/hours-banks/${selectedBank.id}/add`, hoursData)
      toast.success('Horas adicionadas com sucesso!')
      setShowAddHoursModal(false)
      setHoursData({ hours: '', description: '' })
      loadData()
    } catch (error) {
      console.error('Erro ao adicionar horas:', error)
      toast.error('Erro ao adicionar horas')
    }
  }

  const handleConsumeHours = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        hours: parseFloat(hoursData.hours),
        description: hoursData.description,
        referenceType: consumeType
      }

      // Adicionar campos específicos por tipo
      if (consumeType === 'ticket') {
        if (!selectedTicket) {
          toast.error('Selecione um ticket')
          return
        }
        payload.referenceId = selectedTicket.id
        payload.originalHours = originalHours
        
        // Se houve ajuste, adicionar nota
        if (originalHours && parseFloat(hoursData.hours) !== originalHours) {
          payload.adjustmentNote = `Tempo ajustado de ${originalHours}h para ${hoursData.hours}h.`
        }
      } else if (consumeType === 'project') {
        if (!selectedProject) {
          toast.error('Selecione um projeto')
          return
        }
        payload.referenceId = selectedProject.id
        payload.originalHours = originalHours
        
        // Se houve ajuste, adicionar nota
        if (originalHours && parseFloat(hoursData.hours) !== originalHours) {
          payload.adjustmentNote = `Tempo ajustado de ${originalHours}h para ${hoursData.hours}h.`
        }
      } else if (consumeType === 'manual') {
        if (!activityName || activityName.length < 5) {
          toast.error('Nome da atividade deve ter pelo menos 5 caracteres')
          return
        }
        if (!hoursData.description || hoursData.description.length < 20) {
          toast.error('Descrição deve ter pelo menos 20 caracteres para atividades manuais')
          return
        }
        payload.activityName = activityName
      }

      await api.post(`/hours-banks/${selectedBank.id}/consume`, payload)
      toast.success('Horas consumidas com sucesso!')
      
      // Resetar estados
      setShowConsumeModal(false)
      setHoursData({ hours: '', description: '', ticketId: '' })
      setSelectedTicket(null)
      setSelectedProject(null)
      setOriginalHours(null)
      setActivityName('')
      setConsumeType('ticket')
      
      loadData()
    } catch (error) {
      console.error('Erro ao consumir horas:', error)
      toast.error(error.response?.data?.error || 'Erro ao consumir horas')
    }
  }

  // Handler para seleção de ticket
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket)
    
    if (ticket) {
      // Auto-preencher horas com tempo trabalhado
      setOriginalHours(ticket.totalHours)
      setHoursData({
        ...hoursData,
        hours: ticket.totalHours.toString(),
        description: `Ticket #${ticket.ticketNumber} - ${ticket.subject}`
      })
    } else {
      // Limpar quando desselecionar
      setOriginalHours(null)
      setHoursData({
        ...hoursData,
        hours: '',
        description: ''
      })
    }
  }

  // Handler para seleção de projeto
  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    
    if (project) {
      // Calcular horas estimadas
      const calculateEstimatedHours = (proj) => {
        if (!proj.startDate || !proj.estimatedEndDate) return 0;
        
        const start = new Date(proj.startDate);
        const end = new Date(proj.estimatedEndDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Assumindo 8 horas por dia útil (aproximadamente 5 dias por semana)
        const workDays = Math.floor(diffDays * (5/7));
        return workDays * 8;
      };

      const estimatedHours = calculateEstimatedHours(project);
      
      // Auto-preencher horas com tempo estimado
      setOriginalHours(estimatedHours)
      setHoursData({
        ...hoursData,
        hours: estimatedHours.toString(),
        description: `Projeto: ${project.name}${project.description ? ' - ' + project.description : ''}`
      })
    } else {
      // Limpar quando desselecionar
      setOriginalHours(null)
      setHoursData({
        ...hoursData,
        hours: '',
        description: ''
      })
    }
  }

  // Handler para mudança de horas (detectar ajustes)
  const handleHoursChange = (newHours) => {
      const hours = parseFloat(newHours)

      if (originalHours && hours !== originalHours && hours > 0) {
        // Adicionar nota de ajuste automaticamente na descrição
        const adjustmentNote = `Tempo ajustado de ${originalHours}h para ${hours}h. `

        // Verificar se a nota já existe
        if (!hoursData.description.includes('Tempo ajustado')) {
          setHoursData({
            ...hoursData,
            hours: newHours,
            description: adjustmentNote + hoursData.description
          })
        } else {
          // Atualizar nota existente
          const descWithoutNote = hoursData.description.replace(/Tempo ajustado de [\d.]+h para [\d.]+h\. /, '')
          setHoursData({
            ...hoursData,
            hours: newHours,
            description: adjustmentNote + descWithoutNote
          })
        }
      } else {
        setHoursData({
          ...hoursData,
          hours: newHours
        })
      }
    }

  const loadTransactions = async (bankId) => {
    try {
      const response = await api.get(`/hours-banks/${bankId}`)
      setTransactions(response.data.transactions || [])
      setShowTransactionsModal(true)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast.error('Erro ao carregar transações')
    }
  }

  const getProgressPercentage = (bank) => {
    if (bank.totalHours === 0) return 0
    return (bank.usedHours / bank.totalHours) * 100
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      totalHours: '',
      packageType: '',
      startDate: '',
      endDate: '',
      allowNegativeBalance: false,
      minBalance: '',
      notes: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bolsa de Horas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir pacotes de horas dos clientes
          </p>
        </div>
        <PermissionGate permission="hours_bank.manage">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Bolsa
          </button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Disponível</p>
              <p className="text-2xl font-bold">
                {hoursBanks.reduce((acc, b) => acc + (parseFloat(b.totalHours) - parseFloat(b.usedHours)), 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contratado</p>
              <p className="text-2xl font-bold">
                {hoursBanks.reduce((acc, b) => acc + parseFloat(b.totalHours), 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Consumido</p>
              <p className="text-2xl font-bold">
                {hoursBanks.reduce((acc, b) => acc + parseFloat(b.usedHours), 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hours Banks List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Bolsas de Horas</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(filters.clientId || filters.isActive !== '') && (
                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[filters.clientId, filters.isActive !== '' ? '1' : ''].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Filtro por Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente
                </label>
                <select
                  value={filters.clientId}
                  onChange={(e) => handleFilterChange('clientId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos os clientes</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Ativas</option>
                  <option value="false">Inativas</option>
                </select>
              </div>

              {/* Botão Limpar Filtros */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {hoursBanks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhuma bolsa de horas cadastrada</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Criar primeira bolsa
              </button>
            </div>
          ) : (
            hoursBanks.map((bank) => {
              const available = parseFloat(bank.totalHours) - parseFloat(bank.usedHours)
              const percentage = getProgressPercentage(bank)

              return (
                <div
                  key={bank.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{bank.client?.name}</h3>
                        {bank.packageType && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            {bank.packageType}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          bank.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {bank.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        {bank.startDate && (
                          <span>Início: {format(new Date(bank.startDate), 'dd/MM/yyyy', { locale: pt })}</span>
                        )}
                        {bank.endDate && (
                          <span>Fim: {format(new Date(bank.endDate), 'dd/MM/yyyy', { locale: pt })}</span>
                        )}
                        {bank.allowNegativeBalance && (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            Permite crédito
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBank(bank)
                          setShowAddHoursModal(true)
                        }}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-lg transition-colors"
                        title="Adicionar horas"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBank(bank)
                          setShowConsumeModal(true)
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                        title="Consumir horas"
                      >
                        <TrendingDown className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBank(bank)
                          loadTransactions(bank.id)
                        }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                        title="Ver histórico"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{available.toFixed(1)}h</span> disponíveis
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {bank.usedHours}h / {bank.totalHours}h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {bank.notes && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                      {bank.notes}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} bolsas
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNum = index + 1
                    // Mostrar apenas páginas próximas
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            pageNum === pagination.page
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    } else if (
                      pageNum === pagination.page - 2 ||
                      pageNum === pagination.page + 2
                    ) {
                      return <span key={pageNum} className="px-2">...</span>
                    }
                    return null
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Nova Bolsa de Horas
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  Crie um novo pacote de horas para o cliente
                </p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="hoursBankForm" onSubmit={handleCreateBank} className="space-y-5">
                {/* Card: Cliente e Pacote */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-500" />
                    Cliente e Pacote
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cliente *</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      required
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Total de Horas *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.totalHours}
                      onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                      required
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="Ex: 40"
                    />
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Pacote</label>
                    <input
                      type="text"
                      value={formData.packageType}
                      onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="Ex: Premium 50h"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Identificação do tipo de pacote contratado</p>
                  </div>
                </div>

                {/* Card: Período de Validade */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Período de Validade
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Início <span className="text-xs text-gray-500">(opcional)</span></label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Fim <span className="text-xs text-gray-500">(opcional)</span></label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Define o período de validade do pacote de horas</p>
                </div>

                {/* Card: Configurações Avançadas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Configurações Avançadas
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="flex items-center gap-4 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        id="allowNegative"
                        checked={formData.allowNegativeBalance}
                        onChange={(e) => setFormData({ ...formData, allowNegativeBalance: e.target.checked, minBalance: e.target.checked ? formData.minBalance : '' })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-base">Permitir saldo negativo (crédito)</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Permite que o cliente consuma mais horas do que possui
                        </p>
                      </div>
                    </label>
                    {formData.allowNegativeBalance && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limite Mínimo <span className="text-xs text-gray-500">(ex: -10 para -10h)</span></label>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.minBalance}
                          onChange={(e) => setFormData({ ...formData, minBalance: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: -10"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card: Observações */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Observações
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Observações sobre este pacote..."
                    />
                  </div>
                </div>

              </form>
            </div>
          </div>
          
          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="hoursBankForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                Criar Bolsa
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Hours Modal */}
      <Modal isOpen={showAddHoursModal} onClose={() => { setShowAddHoursModal(false); setHoursData({ hours: '', description: '' }); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Adicionar Horas
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  Cliente: {selectedBank?.client?.name}
                </p>
              </div>
              <button
                onClick={() => { setShowAddHoursModal(false); setHoursData({ hours: '', description: '' }); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form id="addHoursForm" onSubmit={handleAddHours} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantidade de Horas *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={hoursData.hours}
                onChange={(e) => setHoursData({ ...hoursData, hours: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 transition-all text-base"
                placeholder="Ex: 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição *</label>
              <textarea
                value={hoursData.description}
                onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 transition-all resize-none text-base"
                placeholder="Motivo da adição..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowAddHoursModal(false); setHoursData({ hours: '', description: '' }); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="addHoursForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Consume Hours Modal */}
      <Modal isOpen={showConsumeModal} onClose={() => { 
        setShowConsumeModal(false)
        setHoursData({ hours: '', description: '', ticketId: '' })
        setSelectedTicket(null)
        setSelectedProject(null)
        setOriginalHours(null)
        setActivityName('')
        setConsumeType('ticket')
      }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingDown className="w-6 h-6" />
                  Consumir Horas
                </h2>
                <p className="text-red-100 text-sm mt-1">
                  Cliente: {selectedBank?.client?.name} • Disponível: <span className="font-semibold">{selectedBank ? (parseFloat(selectedBank.totalHours) - parseFloat(selectedBank.usedHours)).toFixed(1) : 0}h</span>
                </p>
              </div>
              <button
                onClick={() => { 
                  setShowConsumeModal(false)
                  setHoursData({ hours: '', description: '', ticketId: '' })
                  setSelectedTicket(null)
                  setSelectedProject(null)
                  setOriginalHours(null)
                  setActivityName('')
                  setConsumeType('ticket')
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form id="consumeHoursForm" onSubmit={handleConsumeHours} className="p-6 space-y-5">
            
            {/* Tabs para tipo de consumo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tipo de Consumo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConsumeType('ticket')
                    setSelectedTicket(null)
                    setOriginalHours(null)
                    setActivityName('')
                    setHoursData({ hours: '', description: '', ticketId: '' })
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    consumeType === 'ticket'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsumeType('project')
                    setSelectedTicket(null)
                    setSelectedProject(null)
                    setOriginalHours(null)
                    setActivityName('')
                    setHoursData({ hours: '', description: '', ticketId: '' })
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    consumeType === 'project'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Projeto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsumeType('manual')
                    setSelectedTicket(null)
                    setOriginalHours(null)
                    setHoursData({ hours: '', description: '', ticketId: '' })
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    consumeType === 'manual'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Atividade Manual
                </button>
              </div>
            </div>

            {/* Conteúdo por tipo */}
            {consumeType === 'ticket' && (
              <>
                <TicketSearchSelector
                  bankId={selectedBank?.id}
                  onSelect={handleTicketSelect}
                  selectedTicket={selectedTicket}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Quantidade de Horas *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hoursData.hours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base"
                    placeholder="Ex: 2.5"
                  />
                  {originalHours && parseFloat(hoursData.hours) !== originalHours && hoursData.hours && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Valor ajustado (original: {originalHours}h)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Descrição *
                  </label>
                  <textarea
                    value={hoursData.description}
                    onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all resize-none text-base"
                    placeholder="Serviço realizado..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Descreva o trabalho realizado neste ticket
                  </p>
                </div>
              </>
            )}

            {consumeType === 'manual' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Nome da Atividade *
                  </label>
                  <input
                    type="text"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    required
                    minLength={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base"
                    placeholder="Ex: Consultoria técnica, Suporte emergencial..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Mínimo 5 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Quantidade de Horas *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hoursData.hours}
                    onChange={(e) => setHoursData({ ...hoursData, hours: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base"
                    placeholder="Ex: 2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Descrição Detalhada *
                  </label>
                  <textarea
                    value={hoursData.description}
                    onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                    required
                    minLength={20}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all resize-none text-base"
                    placeholder="Descreva detalhadamente o trabalho realizado, problemas resolvidos, etc..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Mínimo 20 caracteres - seja específico sobre o trabalho realizado
                  </p>
                </div>
              </>
            )}

            {consumeType === 'project' && (
              <>
                <ProjectSearchSelector
                  bankId={selectedBank?.id}
                  onSelect={handleProjectSelect}
                  selectedProject={selectedProject}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Quantidade de Horas *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hoursData.hours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base"
                    placeholder="Ex: 2.5"
                  />
                  {originalHours && parseFloat(hoursData.hours) !== originalHours && hoursData.hours && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Valor ajustado (estimado: {originalHours}h)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Descrição *
                  </label>
                  <textarea
                    value={hoursData.description}
                    onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all resize-none text-base"
                    placeholder="Descreva o trabalho realizado no projeto..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Descreva o trabalho realizado neste projeto
                  </p>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { 
                  setShowConsumeModal(false)
                  setHoursData({ hours: '', description: '', ticketId: '' })
                  setSelectedTicket(null)
                  setSelectedProject(null)
                  setOriginalHours(null)
                  setActivityName('')
                  setConsumeType('ticket')
                }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="consumeHoursForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <TrendingDown className="w-5 h-5" />
                Consumir
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Transactions Modal */}
      <Modal isOpen={showTransactionsModal} onClose={() => setShowTransactionsModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Histórico de Transações
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  Cliente: {selectedBank?.client?.name}
                </p>
              </div>
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma transação encontrada</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      transaction.type === 'adicao'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : transaction.type === 'consumo'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>
                      {transaction.type === 'adicao' ? <Plus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-lg">
                          {transaction.type === 'adicao' ? '+' : '-'}{transaction.hours}h
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{transaction.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Por: {transaction.performedBy?.name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <button
              onClick={() => setShowTransactionsModal(false)}
              className="w-full px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HoursBank
