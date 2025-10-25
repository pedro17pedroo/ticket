import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, UserCheck, X } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import { useAuthStore } from '../store/authStore'

const Directions = () => {
  const { user } = useAuthStore()
  const isClientAdmin = user?.role === 'cliente-org' && user?.settings?.clientAdmin === true

  const [directions, setDirections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDirection, setEditingDirection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    isActive: true
  })

  useEffect(() => {
    loadDirections()
  }, [])

  const loadDirections = async () => {
    setLoading(true)
    try {
      const response = await api.get('/client/directions')
      setDirections(response.data.directions || [])
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
        await api.put(`/client/directions/${editingDirection.id}`, formData)
        showSuccess('Atualizada!', 'Direção atualizada com sucesso')
      } else {
        await api.post('/client/directions', formData)
        showSuccess('Criada!', 'Direção criada com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadDirections()
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
      isActive: direction.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('Desativar direção?', 'Esta ação pode ser revertida.')
    if (!confirmed) return
    try {
      await api.delete(`/client/directions/${id}`)
      showSuccess('Desativada!', 'Direção desativada com sucesso')
      loadDirections()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', code: '', isActive: true })
    setEditingDirection(null)
  }

  if (!isClientAdmin) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Acesso restrito. Apenas administradores do cliente podem gerir direções.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Direções</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerir direções da empresa</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nova Direção
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium">Nome</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Código</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Descrição</th>
                <th className="text-center px-6 py-3 text-sm font-medium">Estado</th>
                <th className="text-right px-6 py-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {directions.map((direction) => (
                <tr key={direction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 font-medium">{direction.name}</td>
                  <td className="px-6 py-4">{direction.code || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {direction.description ? direction.description.substring(0, 50) + '...' : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${direction.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {direction.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(direction)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {direction.isActive && (
                        <button onClick={() => handleDelete(direction.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Desativar">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {directions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma direção encontrada. Crie a primeira!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editingDirection ? 'Editar' : 'Nova'} Direção</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Código/Sigla</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  maxLength={20}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>

              {editingDirection && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Ativa</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {editingDirection ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Directions
