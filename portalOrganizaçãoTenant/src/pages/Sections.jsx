import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Grid3x3, X, Save, FileText, Building2, User, Settings, FolderTree, Users } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'

const Sections = () => {
  const [sections, setSections] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    departmentId: '',
    managerId: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sectRes, deptRes, usersRes] = await Promise.all([
        api.get('/sections'),
        api.get('/departments'),
        api.get('/auth/users')
      ])
      setSections(sectRes.data.sections || [])
      setDepartments(deptRes.data.departments || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.departmentId) {
      showError('Erro', 'Departamento é obrigatório')
      return
    }

    try {
      const payload = {
        ...formData,
        managerId: formData.managerId || null
      }

      if (editingSection) {
        await api.put(`/sections/${editingSection.id}`, payload)
        showSuccess('Atualizado!', 'Secção atualizada com sucesso')
      } else {
        await api.post('/sections', payload)
        showSuccess('Criado!', 'Secção criada com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      description: section.description || '',
      code: section.code || '',
      departmentId: section.departmentId || '',
      managerId: section.managerId || '',
      isActive: section.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar secção?',
      'Esta ação não pode ser revertida.'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/sections/${id}`)
      showSuccess('Eliminado!', 'Secção eliminada com sucesso')
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
      departmentId: '',
      managerId: '',
      isActive: true
    })
    setEditingSection(null)
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Secções</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir secções e equipas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Secção
        </button>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FolderTree className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{section.name}</h3>
                  {section.code && <span className="text-xs text-gray-500">#{section.code}</span>}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {section.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {section.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm">
              {section.department && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FolderTree className="w-4 h-4" />
                  <span>{section.department.name}</span>
                </div>
              )}
              {section.manager && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{section.manager.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(section)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(section.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhuma secção encontrada. Crie a primeira!
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
                  <Grid3x3 className="w-6 h-6" />
                  {editingSection ? 'Editar Secção' : 'Nova Secção'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingSection 
                    ? 'Atualize as informações da secção'
                    : 'Crie uma nova secção organizacional'
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
              <form id="sectionForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Secção *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Ex: Secção de Frontend"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        maxLength={20}
                        placeholder="Ex: SEC-FE"
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
                      placeholder="Descreva as atividades desta secção..."
                    />
                  </div>
                </div>

                {/* Card: Hierarquia e Responsável */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-500" />
                    Hierarquia Organizacional
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departamento *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione um departamento...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Obrigatório - Toda secção deve pertencer a um departamento</p>
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
                {editingSection && (
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
                        <span className="font-medium">Secção Ativa</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive ? 'Visível e operacional' : 'Oculta e inativa'}
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
                form="sectionForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingSection ? 'Atualizar' : 'Criar'} Secção
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Sections
