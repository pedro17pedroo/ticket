import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Clock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

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
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
          <Plus className="w-5 h-5" />
          Novo SLA
        </button>
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
                <button onClick={() => { setEditingSLA(sla); setFormData(sla); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(sla.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingSLA ? 'Editar' : 'Novo'} SLA</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" placeholder="Ex: SLA Prioridade Média" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prioridade *</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
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
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tempo de Resposta (minutos) *</label>
                <input type="number" value={formData.responseTimeMinutes} onChange={(e) => setFormData({ ...formData, responseTimeMinutes: parseInt(e.target.value) })} required min="1" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tempo de Resolução (minutos) *</label>
                <input type="number" value={formData.resolutionTimeMinutes} onChange={(e) => setFormData({ ...formData, resolutionTimeMinutes: parseInt(e.target.value) })} required min="1" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingSLA(null); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">{editingSLA ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SLAs
