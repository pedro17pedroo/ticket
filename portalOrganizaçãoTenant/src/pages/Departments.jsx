import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users, Building2, X, Save, FileText, Mail, User, Settings, Building } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [directions, setDirections] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    email: '',
    directionId: '',
    managerId: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [deptRes, dirRes, usersRes] = await Promise.all([
        api.get('/departments'),
        api.get('/directions'),
        api.get('/auth/users')
      ])
      setDepartments(deptRes.data.departments || [])
      setDirections(dirRes.data.directions || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar direção obrigatória
    if (!formData.directionId) {
      showError('Campo obrigatório', 'Por favor, selecione uma direção. Todos os departamentos devem pertencer a uma direção.')
      return
    }
    
    try {
      // Construir payload apenas com campos preenchidos
      const payload = {
        name: formData.name,
        directionId: formData.directionId,
        isActive: formData.isActive
      }
      
      // Adicionar campos opcionais apenas se preenchidos
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description
      }
      if (formData.code && formData.code.trim()) {
        payload.code = formData.code
      }
      if (formData.email && formData.email.trim()) {
        payload.email = formData.email
      }
      if (formData.managerId && formData.managerId.trim()) {
        payload.managerId = formData.managerId
      }

      console.log('📤 Enviando payload:', payload)

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, payload)
        showSuccess('Atualizado!', 'Departamento atualizado com sucesso')
      } else {
        await api.post('/departments', payload)
        showSuccess('Criado!', 'Departamento criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('❌ Erro detalhado:', error.response?.data)
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      code: department.code || '',
      email: department.email || '',
      directionId: department.directionId || '',
      managerId: department.managerId || '',
      isActive: department.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar departamento?',
      'Esta ação não pode ser revertida.'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/departments/${id}`)
      showSuccess('Eliminado!', 'Departamento eliminado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      email: '',
      directionId: '',
      managerId: '',
      isActive: true
    })
    setEditingDepartment(null)
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Alerta sobre hierarquia */}
      {directions.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">Nenhuma Direção encontrada</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Para criar departamentos, é necessário primeiro criar pelo menos uma Direção. 
                <br/>A estrutura hierárquica é: <strong>Direção → Departamento → Secção</strong>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir departamentos e equipas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={directions.length === 0}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title={directions.length === 0 ? 'Crie uma Direção primeiro' : ''}
        >
          <Plus className="w-5 h-5" />
          Novo Departamento
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                  {dept.code && <span className="text-xs text-gray-500">#{dept.code}</span>}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {dept.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {dept.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dept.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm">
              {dept.direction && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{dept.direction.name}</span>
                </div>
              )}
              {dept.manager && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{dept.manager.name}</span>
                </div>
              )}
              {dept.sectionsCount > 0 && (
                <div className="text-primary-600 font-medium">
                  {dept.sectionsCount} secç{dept.sectionsCount === 1 ? 'ão' : 'ões'}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(dept)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(dept.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum departamento encontrado. Crie o primeiro!
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingDepartment 
                    ? 'Atualize as informações do departamento'
                    : 'Crie um novo departamento na organização'
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
          <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="departmentForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Departamento *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Ex: Departamento de TI"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        maxLength={20}
                        placeholder="Ex: DEP-TI"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descreva as responsabilidades deste departamento..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="departamento@empresa.com"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Card: Hierarquia e Responsável */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary-500" />
                    Hierarquia Organizacional
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direção *</label>
                    <select
                      value={formData.directionId}
                      onChange={(e) => setFormData({ ...formData, directionId: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione uma direção...</option>
                      {directions.map((dir) => (
                        <option key={dir.id} value={dir.id}>{dir.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Obrigatório - Todo departamento deve pertencer a uma direção</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-400" />
                      Responsável
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Nenhum responsável</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card: Configurações (apenas ao editar) */}
                {editingDepartment && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary-500" />
                      Configurações
                    </h3>
                    
                    <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Departamento Ativo</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive ? 'Visível e operacional' : 'Oculto e inativo'}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

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
                form="departmentForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingDepartment ? 'Atualizar' : 'Criar'} Departamento
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Departments
