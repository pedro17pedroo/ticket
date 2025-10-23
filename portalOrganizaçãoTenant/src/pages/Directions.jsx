import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building, Users } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

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
      if (editingDirection) {
        await api.put(`/directions/${editingDirection.id}`, formData)
        showSuccess('Atualizado!', 'Direção atualizada com sucesso')
      } else {
        await api.post('/directions', formData)
        showSuccess('Criado!', 'Direção criada com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Direção
        </button>
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
                <button onClick={() => handleEdit(direction)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(direction.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingDirection ? 'Editar' : 'Nova'} Direção</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Código/Sigla</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" placeholder="Ex: DIR-TI" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Responsável</label>
                <select value={formData.managerId} onChange={(e) => setFormData({ ...formData, managerId: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                  <option value="">Sem responsável</option>
                  {users.filter(u => u.role !== 'cliente-org').map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <label className="text-sm">Ativa</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">{editingDirection ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Directions
