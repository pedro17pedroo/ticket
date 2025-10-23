import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ticketService } from '../services/api'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const NewTicket = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [priorities, setPriorities] = useState([])
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [prioritiesRes, typesRes, categoriesRes] = await Promise.all([
        ticketService.getPriorities(),
        ticketService.getTypes(),
        ticketService.getCategories()
      ])
      setPriorities(prioritiesRes.priorities || [])
      setTypes(typesRes.types || [])
      setCategories(categoriesRes.categories || [])
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await ticketService.create(data)
      toast.success('Ticket criado com sucesso!')
      navigate(`/tickets/${response.ticket.id}`)
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
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
            Descreva seu problema ou solicitação
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
              placeholder="Ex: Problema com acesso ao sistema"
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
            <textarea
              {...register('description', { 
                required: 'Descrição é obrigatória',
                minLength: { value: 20, message: 'Mínimo 20 caracteres' }
              })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              placeholder="Descreva detalhadamente o problema ou solicitação. Inclua:&#10;- O que aconteceu?&#10;- Quando aconteceu?&#10;- Passos para reproduzir (se aplicável)&#10;- Mensagens de erro (se houver)"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Quanto mais detalhes você fornecer, mais rápido poderemos ajudá-lo.
            </p>
          </div>

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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selecione a urgência do seu problema
              </p>
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

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              💡 Dicas para um atendimento mais rápido:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Seja específico no assunto</li>
              <li>Descreva todos os passos que levaram ao problema</li>
              <li>Inclua mensagens de erro, se houver</li>
              <li>Adicione capturas de tela se possível (em breve)</li>
            </ul>
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
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'A criar...' : 'Criar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTicket
