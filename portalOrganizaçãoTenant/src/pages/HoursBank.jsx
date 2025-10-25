import { useState, useEffect } from 'react'
import { Clock, Plus, TrendingUp, TrendingDown, DollarSign, Eye, History } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const HoursBank = () => {
  const [hoursBanks, setHoursBanks] = useState([])
  const [clients, setClients] = useState([])
  const [completedTickets, setCompletedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddHoursModal, setShowAddHoursModal] = useState(false)
  const [showConsumeModal, setShowConsumeModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState(null)
  const [transactions, setTransactions] = useState([])

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [banksRes, clientsRes] = await Promise.all([
        api.get('/hours-banks'),
        api.get('/clients')
      ])
      setHoursBanks(banksRes.data.hoursBanks || [])
      setClients(clientsRes.data.clients || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar bolsas de horas')
    } finally {
      setLoading(false)
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
      await api.post(`/hours-banks/${selectedBank.id}/consume`, hoursData)
      toast.success('Horas consumidas com sucesso!')
      setShowConsumeModal(false)
      setHoursData({ hours: '', description: '', ticketId: '' })
      loadData()
    } catch (error) {
      console.error('Erro ao consumir horas:', error)
      toast.error(error.response?.data?.error || 'Erro ao consumir horas')
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

  const loadCompletedTickets = async (clientId) => {
    try {
      const params = clientId ? { clientId } : {}
      const response = await api.get('/hours-banks/tickets/completed', { params })
      setCompletedTickets(response.data.tickets || [])
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
      toast.error('Erro ao carregar tickets concluídos')
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Bolsa
        </button>
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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Bolsas de Horas Ativas</h2>
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
                          loadCompletedTickets(bank.clientId)
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nova Bolsa de Horas</h2>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cliente *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total de Horas *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: 40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Pacote</label>
                <input
                  type="text"
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: Premium 50h"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Início <span className="text-xs text-gray-500">(opcional)</span></label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Fim <span className="text-xs text-gray-500">(opcional)</span></label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Saldo Negativo */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="allowNegative"
                    checked={formData.allowNegativeBalance}
                    onChange={(e) => setFormData({ ...formData, allowNegativeBalance: e.target.checked, minBalance: e.target.checked ? formData.minBalance : '' })}
                    className="rounded"
                  />
                  <label htmlFor="allowNegative" className="text-sm font-medium">
                    Permitir saldo negativo (crédito)
                  </label>
                </div>
                {formData.allowNegativeBalance && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Limite Mínimo <span className="text-xs text-gray-500">(ex: -10 para -10h)</span></label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.minBalance}
                      onChange={(e) => setFormData({ ...formData, minBalance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      placeholder="Ex: -10"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Observações sobre este pacote..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Criar Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hours Modal */}
      {showAddHoursModal && selectedBank && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Adicionar Horas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cliente: <strong>{selectedBank.client?.name}</strong>
            </p>
            <form onSubmit={handleAddHours} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantidade de Horas *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={hoursData.hours}
                  onChange={(e) => setHoursData({ ...hoursData, hours: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição *</label>
                <textarea
                  value={hoursData.description}
                  onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Motivo da adição..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddHoursModal(false)
                    setHoursData({ hours: '', description: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consume Hours Modal */}
      {showConsumeModal && selectedBank && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Consumir Horas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cliente: <strong>{selectedBank.client?.name}</strong><br />
              Disponível: <strong className="text-green-600">{(parseFloat(selectedBank.totalHours) - parseFloat(selectedBank.usedHours)).toFixed(1)}h</strong>
            </p>
            <form onSubmit={handleConsumeHours} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ticket Concluído *</label>
                <select
                  value={hoursData.ticketId}
                  onChange={(e) => setHoursData({ ...hoursData, ticketId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  <option value="">Selecione o ticket</option>
                  {completedTickets.map(ticket => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.ticketNumber} - {ticket.subject}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas tickets com status "Concluído" podem ser selecionados
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantidade de Horas *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={hoursData.hours}
                  onChange={(e) => setHoursData({ ...hoursData, hours: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: 2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição *</label>
                <textarea
                  value={hoursData.description}
                  onChange={(e) => setHoursData({ ...hoursData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Serviço realizado..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowConsumeModal(false)
                    setHoursData({ hours: '', description: '', ticketId: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Consumir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactionsModal && selectedBank && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Histórico de Transações</h2>
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Cliente: <strong>{selectedBank.client?.name}</strong>
            </p>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'adicao'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : transaction.type === 'consumo'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>
                      {transaction.type === 'adicao' ? <Plus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {transaction.type === 'adicao' ? '+' : '-'}{transaction.hours}h
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Por: {transaction.performedBy?.name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoursBank
