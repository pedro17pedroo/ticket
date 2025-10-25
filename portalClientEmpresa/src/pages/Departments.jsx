import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, X } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import { useAuthStore } from '../store/authStore'

const Departments = () => {
  const { user } = useAuthStore()
  const isClientAdmin = user?.role === 'cliente-org' && user?.settings?.clientAdmin === true

  const [departments, setDepartments] = useState([])
  const [directions, setDirections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    directionId: '',
    email: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [depsRes, dirsRes] = await Promise.all([
        api.get('/client/departments'),
        api.get('/client/directions')
      ])
      setDepartments(depsRes.data.departments || [])
      setDirections(dirsRes.data.directions || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, directionId: formData.directionId || null }
      if (editingDepartment) {
        await api.put(`/client/departments/${editingDepartment.id}`, payload)
        showSuccess('Atualizado!', 'Departamento atualizado com sucesso')
      } else {
        await api.post('/client/departments', payload)
        showSuccess('Criado!', 'Departamento criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (dept) => {
    setEditingDepartment(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      code: dept.code || '',
      directionId: dept.directionId || '',
      email: dept.email || '',
      isActive: dept.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('Desativar departamento?', 'Esta ação pode ser revertida.')
    if (!confirmed) return
    try {
      await api.delete(`/client/departments/${id}`)
      showSuccess('Desativado!', 'Departamento desativado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', code: '', directionId: '', email: '', isActive: true })
    setEditingDepartment(null)
  }

  if (!isClientAdmin) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Acesso restrito.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerir departamentos da empresa</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" />
          Novo Departamento
        </button>
      </div>

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
                <th className="text-left px-6 py-3 text-sm font-medium">Direção</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Código</th>
                <th className="text-center px-6 py-3 text-sm font-medium">Estado</th>
                <th className="text-right px-6 py-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 font-medium">{dept.name}</td>
                  <td className="px-6 py-4">{dept.direction?.name || '-'}</td>
                  <td className="px-6 py-4">{dept.code || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {dept.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(dept)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {dept.isActive && (
                        <button onClick={() => handleDelete(dept.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {departments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum departamento encontrado. Crie o primeiro!
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editingDepartment ? 'Editar' : 'Novo'} Departamento</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Direção</label>
                <select value={formData.directionId} onChange={(e) => setFormData({ ...formData, directionId: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                  <option value="">Nenhuma</option>
                  {directions.filter(d => d.isActive).map(dir => (
                    <option key={dir.id} value={dir.id}>{dir.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Código</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} maxLength={20} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>

              {editingDepartment && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                  <label className="text-sm">Ativo</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">{editingDepartment ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Departments
