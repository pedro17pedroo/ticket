import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Clock, X, Save, FileText, Timer, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'

const SLAs = () => {
  const [slas, setSlas] = useState([])
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSLA, setEditingSLA] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    priority: '',
    responseTimeMinutes: 60,
    resolutionTimeMinutes: 480
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadSLAs(), loadPriorities()])
  }

  const loadPriorities = async () => {
    try {
      const response = await api.get('/priorities')
      const priorityList = response.data.priorities || []
      setPriorities(priorityList)
      // Definir primeira prioridade como padrão se existir
      if (priorityList.length > 0 && !formData.priority) {
        setFormData(prev => ({ ...prev, priority: priorityList[0].name }))
      }
    } catch (error) {
      console.error('Erro ao carregar prioridades:', error)
    }
  }

  const loadSLAs = async () => {
    try {
      const response = await api.get('/slas')
      setSlas(response.data.slas || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSLA) {
        await api.put(`/slas/${editingSLA.id}`, formData)
        showSuccess('Atualizado!', 'SLA atualizado com sucesso')
      } else {
        await api.post('/slas', formData)
        showSuccess('Criado!', 'SLA criado com sucesso')
      }
      setShowModal(false)
      setFormData({ name: '', priority: priorities[0]?.name || '', responseTimeMinutes: 60, resolutionTimeMinutes: 480 })
      setEditingSLA(null)
      loadSLAs()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
      console.error('Erro:', error)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar SLA?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/slas/${id}`)
      showSuccess('Eliminado!', 'SLA eliminado com sucesso')
      loadSLAs()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
      console.error('Erro:', error)
    }
  }

  const getPriorityBadge = (priorityName) => {
    // Buscar prioridade pelo nome (case-insensitive)
    const priority = priorities.find(p => 
      p.name.toLowerCase() === priorityName.toLowerCase()
    )
    
    // Cores padrão para prioridades antigas
    const defaultColors = {
      'baixa': '#10B981',
      'media': '#3B82F6',
      'média': '#3B82F6',
      'alta': '#F59E0B',
      'urgente': '#EF4444',
      'crítico': '#DC2626',
      'critico': '#DC2626'
    }
    
    const color = priority?.color || defaultColors[priorityName.toLowerCase()] || '#6B7280'
    const displayName = priority?.name || priorityName
    
    return (
      <span 
        className="px-2 py-1 text-xs font-semibold rounded-full"
        style={{ 
          backgroundColor: `${color}20`,
          color: color
        }}
      >
        {displayName}
      </span>
    )
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'min' : ''}` : `${mins}min`
  }

  const resetForm = () => {
    setFormData({ 
      name: '', 
      priority: priorities[0]?.name || '', 
      responseTimeMinutes: 60, 
      resolutionTimeMinutes: 480 
    })
    setEditingSLA(null)
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLAs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir tempos de resposta e resolução</p>
        </div>
        <PermissionGate permission="settings.manage_sla">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
            <Plus className="w-5 h-5" />
            Novo SLA
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slas.map((sla) => (
          <div key={sla.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{sla.name}</h3>
                {getPriorityBadge(sla.priority)}
              </div>
              <div className="flex gap-2">
                <PermissionGate permission="settings.manage_sla">
                  <button onClick={() => { setEditingSLA(sla); setFormData(sla); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </PermissionGate>
                <PermissionGate permission="settings.manage_sla">
                  <button onClick={() => handleDelete(sla.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </PermissionGate>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tempo de Resposta:</span>
                <span className="font-medium">{formatTime(sla.responseTimeMinutes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tempo de Resolução:</span>
                <span className="font-medium">{formatTime(sla.resolutionTimeMinutes)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slas.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhum SLA configurado</p>
          <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-6 py-2 rounded-lg">Criar Primeiro SLA</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  {editingSLA ? 'Editar SLA' : 'Novo SLA'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingSLA 
                    ? 'Atualize os tempos de resposta e resolução'
                    : 'Defina os tempos de atendimento por prioridade'
                  }
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
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
              <form id="slaForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nome do SLA *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base" 
                      placeholder="Ex: SLA Prioridade Média" 
                    />
                  </div>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      Prioridade *
                    </label>
                    <select 
                      value={formData.priority} 
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })} 
                      required 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      {priorities.length === 0 ? (
                        <option value="">Nenhuma prioridade disponível</option>
                      ) : (
                        priorities.map(priority => (
                          <option key={priority.id} value={priority.name}>
                            {priority.name}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Selecione a prioridade associada a este SLA</p>
                  </div>
                </div>
                {/* Card: Tempos de Atendimento */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary-500" />
                    Tempos de Atendimento
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tempo de Resposta (minutos) *</label>
                    <input 
                      type="number" 
                      value={formData.responseTimeMinutes} 
                      onChange={(e) => setFormData({ ...formData, responseTimeMinutes: parseInt(e.target.value) })} 
                      required 
                      min="1" 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base" 
                      placeholder="60"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tempo máximo para a primeira resposta ao ticket</p>
                  </div>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tempo de Resolução (minutos) *</label>
                    <input 
                      type="number" 
                      value={formData.resolutionTimeMinutes} 
                      onChange={(e) => setFormData({ ...formData, resolutionTimeMinutes: parseInt(e.target.value) })} 
                      required 
                      min="1" 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base" 
                      placeholder="480"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tempo máximo para resolver completamente o ticket</p>
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
                onClick={() => { setShowModal(false); setEditingSLA(null); }} 
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="slaForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingSLA ? 'Atualizar' : 'Criar'} SLA
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SLAs
