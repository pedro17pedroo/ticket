import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ticketService } from '../services/api'
import api from '../services/api'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import RichTextEditor from '../components/RichTextEditor'

const NewTicket = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [priorities, setPriorities] = useState([])
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [agents, setAgents] = useState([])
  const [attachments, setAttachments] = useState([])
  const [description, setDescription] = useState('')
  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [prioritiesRes, typesRes, categoriesRes, usersRes] = await Promise.all([
        api.get('/priorities'),
        api.get('/types'),
        api.get('/categories'),
        api.get('/users')
      ])
      setPriorities(prioritiesRes.data.priorities || [])
      setTypes(typesRes.data.types || [])
      setCategories(categoriesRes.data.categories || [])
      
      // Filtrar apenas agentes e admins
      const agentsList = usersRes.data.users?.filter(
        u => u.role === 'agente' || u.role === 'admin-org'
      ) || []
      setAgents(agentsList)
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error)
      toast.error('Erro ao carregar opções do formulário')
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Validar descrição
      if (!description || description.trim() === '' || description === '<p><br></p>') {
        toast.error('Descrição é obrigatória')
        setLoading(false)
        return
      }

      // Criar ticket com descrição HTML
      const ticketData = {
        ...data,
        description
      }
      const response = await ticketService.create(ticketData)
      const ticketId = response.ticket.id

      // Upload de anexos se houver
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach(file => {
          formData.append('files', file)
        })

        try {
          await api.post(`/tickets/${ticketId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (uploadError) {
          console.error('Erro ao fazer upload:', uploadError)
          toast.error('Ticket criado, mas erro ao anexar arquivos')
        }
      }

      toast.success('Ticket criado com sucesso!')
      navigate(`/tickets/${ticketId}`)
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
      toast.error('Erro ao criar ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Novo Ticket</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Criar um novo ticket de suporte
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Assunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('subject', { 
                required: 'Assunto é obrigatório',
                minLength: { value: 5, message: 'Mínimo 5 caracteres' }
              })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              placeholder="Descreva brevemente o problema ou solicitação"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição Detalhada <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzir (se aplicável)...

Você pode usar:
• Negrito, itálico, sublinhado
• Listas e numeração
• Cores e destaques
• Links"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Use a barra de ferramentas para formatar o texto
            </p>
          </div>

          {/* Spacer */}
          <div className="h-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                {priorities.length === 0 ? (
                  <option value="">Carregando...</option>
                ) : (
                  priorities.map(priority => (
                    <option key={priority.id} value={priority.name}>
                      {priority.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                {types.length === 0 ? (
                  <option value="">Carregando...</option>
                ) : (
                  types.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">Selecione uma categoria (opcional)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium mb-2">Atribuir a</label>
            <select
              {...register('assigneeId')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">Não atribuído (opcional)</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} {agent.role === 'admin-org' ? '(Admin)' : '(Agente)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecione um agente para atribuir este ticket
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">Anexos</label>
            <FileUpload
              onFilesChange={setAttachments}
              maxSize={20}
              maxFiles={5}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'A criar...' : 'Criar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTicket
