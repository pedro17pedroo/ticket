import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, FolderKanban, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getProjectById, 
  createProject, 
  updateProject,
  PROJECT_STATUSES, 
  PROJECT_METHODOLOGIES 
} from '../services/projectService'

/**
 * ProjectForm Component
 * Form for creating and editing projects
 * Requirements: 1.1, 1.2, 1.4
 */
const ProjectForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = id && id !== 'new'
  
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    methodology: 'waterfall',
    status: 'planning',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (isEdit) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      const response = await getProjectById(id)
      const project = response.project || response
      
      setFormData({
        name: project.name || '',
        description: project.description || '',
        methodology: project.methodology || 'waterfall',
        status: project.status || 'planning',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : ''
      })
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      toast.error('Erro ao carregar projeto')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Name validation - required, max 255 characters
    if (!formData.name.trim()) {
      newErrors.name = 'O nome do projeto é obrigatório'
    } else if (formData.name.length > 255) {
      newErrors.name = 'O nome não pode ter mais de 255 caracteres'
    }
    
    // Description validation - max 2000 characters
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'A descrição não pode ter mais de 2000 caracteres'
    }
    
    // Methodology validation
    const validMethodologies = PROJECT_METHODOLOGIES.map(m => m.value)
    if (!validMethodologies.includes(formData.methodology)) {
      newErrors.methodology = 'Metodologia inválida'
    }
    
    // Status validation
    const validStatuses = PROJECT_STATUSES.map(s => s.value)
    if (!validStatuses.includes(formData.status)) {
      newErrors.status = 'Status inválido'
    }
    
    // Date validation - end date must be >= start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (endDate < startDate) {
        newErrors.endDate = 'A data de fim deve ser igual ou posterior à data de início'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }
    
    setSaving(true)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        methodology: formData.methodology,
        status: formData.status,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      }

      if (isEdit) {
        await updateProject(id, payload)
        toast.success('Projeto atualizado com sucesso')
        navigate(`/projects/${id}`)
      } else {
        const response = await createProject(payload)
        toast.success('Projeto criado com sucesso')
        const newProjectId = response.project?.id || response.id
        navigate(newProjectId ? `/projects/${newProjectId}` : '/projects')
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao salvar projeto'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <FolderKanban className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? 'Editar Projeto' : 'Novo Projeto'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Atualize as informações do projeto' : 'Crie um novo projeto para a organização'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Nome do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Migração de Sistema ERP"
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  errors.name 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.name.length}/255 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva os objetivos e escopo do projeto..."
                maxLength={2000}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  errors.description 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.description.length}/2000 caracteres
              </p>
            </div>

            {/* Metodologia */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Metodologia <span className="text-red-500">*</span>
              </label>
              <select
                name="methodology"
                value={formData.methodology}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  errors.methodology 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {PROJECT_METHODOLOGIES.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.methodology && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.methodology}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selecione a metodologia de gestão do projeto
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  errors.status 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {PROJECT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.status}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Cronograma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium mb-2">Data de Início</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Data prevista para início do projeto
              </p>
            </div>

            {/* Data de Fim */}
            <div>
              <label className="block text-sm font-medium mb-2">Data de Fim</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  errors.endDate 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endDate}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Data prevista para conclusão do projeto
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'A guardar...' : (isEdit ? 'Guardar Alterações' : 'Criar Projeto')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
