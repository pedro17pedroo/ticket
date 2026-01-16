import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building, X, Users, Save, FileText, User, Settings } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'

const Directions = () => {
  const [directions, setDirections] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDirection, setEditingDirection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    managerId: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [directionsRes, usersRes] = await Promise.all([
        api.get('/directions'),
        api.get('/auth/users')
      ])
      setDirections(directionsRes.data.directions || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Construir payload apenas com campos preenchidos
      const payload = {
        name: formData.name,
        isActive: formData.isActive
      }
      
      // Adicionar campos opcionais apenas se preenchidos
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description
      }
      if (formData.code && formData.code.trim()) {
        payload.code = formData.code
      }
      if (formData.managerId && formData.managerId.trim()) {
        payload.managerId = formData.managerId
      }

      console.log('📤 Enviando payload:', payload)

      if (editingDirection) {
        await api.put(`/directions/${editingDirection.id}`, payload)
        showSuccess('Atualizado!', 'Direção atualizada com sucesso')
      } else {
        await api.post('/directions', payload)
        showSuccess('Criado!', 'Direção criada com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('❌ Erro detalhado:', error.response?.data)
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (direction) => {
    setEditingDirection(direction)
    setFormData({
      name: direction.name,
      description: direction.description || '',
      code: direction.code || '',
      managerId: direction.managerId || '',
      isActive: direction.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar direção?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/directions/${id}`)
      showSuccess('Eliminado!', 'Direção eliminada com sucesso')
      loadData()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      managerId: '',
      isActive: true
    })
    setEditingDirection(null)
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Direções</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir direções da organização</p>
        </div>
        <PermissionGate permission="directions.create">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Direção
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {directions.map((direction) => (
          <div key={direction.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{direction.name}</h3>
                  {direction.code && (
                    <p className="text-sm text-gray-500">{direction.code}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <PermissionGate permission="directions.update">
                  <button onClick={() => handleEdit(direction)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </PermissionGate>
                <PermissionGate permission="directions.delete">
                  <button onClick={() => handleDelete(direction.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </PermissionGate>
              </div>
            </div>
            {direction.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{direction.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {direction.departments?.length || 0} departamentos
              </span>
              {direction.manager && (
                <span>Gestor: {direction.manager.name}</span>
              )}
            </div>
            {!direction.isActive && (
              <span className="inline-block mt-3 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inativa</span>
            )}
          </div>
        ))}
      </div>

      {directions.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhuma direção criada</p>
          <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-6 py-2 rounded-lg">Criar Primeira Direção</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building className="w-6 h-6" />
                  {editingDirection ? 'Editar Direção' : 'Nova Direção'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingDirection 
                    ? 'Atualize as informações da direção'
                    : 'Crie uma nova direção organizacional'
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
              <form id="directionForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nome da Direção *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="Ex: Direção de Tecnologia"
                    />
                  </div>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Código/Sigla</label>
                    <input 
                      type="text" 
                      value={formData.code} 
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base" 
                      placeholder="Ex: DIR-TI" 
                    />
                  </div>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Descrição</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      rows={4} 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-base"
                      placeholder="Descreva o propósito e responsabilidades desta direção..."
                    />
                  </div>
                </div>

                {/* Card: Responsável e Configurações */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Responsável e Configurações
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      Responsável pela Direção
                    </label>
                    <select 
                      value={formData.managerId} 
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })} 
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      <option value="">Nenhum responsável</option>
                      {users.filter(u => u.role !== 'cliente-org').map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive} 
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Direção Ativa</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.isActive ? 'Visível e operacional' : 'Oculta e inativa'}
                      </p>
                    </div>
                  </label>
                </div>
              </form>
            </div>
          </div>
          
          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="directionForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingDirection ? 'Atualizar' : 'Criar'} Direção
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Directions
