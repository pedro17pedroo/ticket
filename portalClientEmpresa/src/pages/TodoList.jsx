import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar,
  Clock,
  User,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  Circle
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import todoService from '../services/todoService'
import TodoModal from '../components/TodoModal'
import CollaboratorModal from '../components/CollaboratorModal'

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-gray-100 dark:bg-gray-700', icon: Circle },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-100 dark:bg-blue-900/30', icon: Clock },
  { id: 'done', title: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle }
]

const PRIORITY_COLORS = {
  low: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  medium: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  high: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
}

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
}

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' ou 'list'
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false)
  const [selectedTodoForCollab, setSelectedTodoForCollab] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  useEffect(() => {
    loadTodos()
  }, [filterPriority])

  const loadTodos = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterPriority !== 'all') params.priority = filterPriority
      const data = await todoService.getAll(params)
      setTodos(data.todos || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      toast.error('Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTodo = () => {
    setEditingTodo(null)
    setShowModal(true)
  }

  const handleEditTodo = (todo) => {
    setEditingTodo(todo)
    setShowModal(true)
  }

  const handleSaveTodo = async (data) => {
    try {
      if (editingTodo) {
        await todoService.update(editingTodo.id, data)
        toast.success('Tarefa atualizada')
      } else {
        await todoService.create(data)
        toast.success('Tarefa criada')
      }
      setShowModal(false)
      loadTodos()
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      toast.error('Erro ao salvar tarefa')
    }
  }

  const handleDeleteTodo = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    try {
      await todoService.delete(id)
      toast.success('Tarefa excluída')
      loadTodos()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    }
  }

  const handleOpenCollaborators = (todo) => {
    setSelectedTodoForCollab(todo)
    setShowCollaboratorModal(true)
  }

  const handleStatusChange = async (todo, newStatus) => {
    if (todo.status === newStatus) return
    
    const oldStatus = todo.status
    
    // Atualizar otimisticamente a UI
    setTodos(prevTodos => 
      prevTodos.map(t => 
        t.id === todo.id ? { ...t, status: newStatus } : t
      )
    )

    try {
      await todoService.update(todo.id, { status: newStatus })
      toast.success('Status atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
      // Reverter em caso de erro
      setTodos(prevTodos => 
        prevTodos.map(t => 
          t.id === todo.id ? { ...t, status: oldStatus } : t
        )
      )
    }
  }

  // Drag and Drop handlers - simplificados
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleDragStart = (e, todo) => {
    dragItem.current = todo
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', todo.id)
    // Delay para permitir que o elemento seja renderizado antes de aplicar opacity
    requestAnimationFrame(() => {
      if (e.target) e.target.style.opacity = '0.5'
    })
  }

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1'
    dragItem.current = null
    dragOverItem.current = null
    setDragOverColumn(null)
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverItem.current = columnId
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleDragLeave = (e, columnId) => {
    // Verificar se realmente saiu da coluna
    const relatedTarget = e.relatedTarget
    if (!e.currentTarget.contains(relatedTarget)) {
      if (dragOverColumn === columnId) {
        setDragOverColumn(null)
      }
    }
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    
    const todo = dragItem.current
    setDragOverColumn(null)
    
    if (!todo) {
      console.log('Nenhum todo para mover')
      return
    }
    
    // Se o status é o mesmo, não fazer nada
    if (todo.status === newStatus) {
      console.log('Mesmo status, ignorando')
      dragItem.current = null
      return
    }

    const todoId = todo.id
    const oldStatus = todo.status
    
    console.log(`Movendo ${todoId} de ${oldStatus} para ${newStatus}`)

    // Atualizar otimisticamente a UI
    setTodos(prevTodos => 
      prevTodos.map(t => 
        t.id === todoId ? { ...t, status: newStatus } : t
      )
    )

    // Limpar referência
    dragItem.current = null

    try {
      await todoService.move(todoId, { status: newStatus, order: 0 })
      toast.success('Tarefa movida!')
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
      toast.error('Erro ao mover tarefa')
      // Reverter em caso de erro
      setTodos(prevTodos => 
        prevTodos.map(t => 
          t.id === todoId ? { ...t, status: oldStatus } : t
        )
      )
    }
  }

  // Filtrar por busca
  const filteredTodos = todos.filter(todo => {
    if (!search) return true
    return todo.title.toLowerCase().includes(search.toLowerCase()) ||
           todo.description?.toLowerCase().includes(search.toLowerCase())
  })

  // Agrupar por status para Kanban
  const todosByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredTodos.filter(t => t.status === col.id)
    return acc
  }, {})

  const TodoCard = ({ todo }) => {
    return (
      <div
        draggable="true"
        onDragStart={(e) => handleDragStart(e, todo)}
        onDragEnd={handleDragEnd}
        className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
      >
        {/* Indicador de cor */}
        {todo.color && (
          <div 
            className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
            style={{ backgroundColor: todo.color }}
          />
        )}
        
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white flex-1 line-clamp-2">
            {todo.title}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleEditTodo(todo); }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {todo.isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTodo(todo.id); }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {todo.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {todo.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[todo.priority]}`}>
              {PRIORITY_LABELS[todo.priority]}
            </span>
            {todo.dueDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(todo.dueDate), 'dd/MM', { locale: pt })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {todo.collaborators?.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenCollaborators(todo); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500"
              >
                <Users className="w-3 h-3" />
                {todo.collaborators.length}
              </button>
            )}
            {todo.isOwner && !todo.collaborators?.length && (
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenCollaborators(todo); }}
                className="p-1 text-gray-400 hover:text-primary-500"
                title="Adicionar colaboradores"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minhas Tarefas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie suas tarefas do dia a dia
          </p>
        </div>

        <button
          onClick={handleCreateTodo}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Todas as prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            title="Vista Kanban"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            title="Vista Lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const Icon = column.icon
            const isOver = dragOverColumn === column.id
            return (
              <div
                key={column.id}
                className={`${column.color} rounded-xl p-4 min-h-[400px] transition-all ${
                  isOver ? 'ring-2 ring-primary-500 ring-opacity-50 scale-[1.02]' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                    {column.title}
                  </h3>
                  <span className="ml-auto bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-sm px-2 py-0.5 rounded-full">
                    {todosByStatus[column.id]?.length || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  {todosByStatus[column.id]?.map((todo) => (
                    <TodoCard 
                      key={todo.id} 
                      todo={todo} 
                    />
                  ))}

                  {todosByStatus[column.id]?.length === 0 && (
                    <div className={`text-center py-8 border-2 border-dashed rounded-lg transition-colors ${
                      isOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent'
                    }`}>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {isOver ? 'Solte aqui' : 'Nenhuma tarefa'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Tarefa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Prioridade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Data Limite</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Colaboradores</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTodos.map((todo) => (
                <tr key={todo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <select
                      value={todo.status}
                      onChange={(e) => handleStatusChange(todo, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                        todo.status === 'todo' ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200' :
                        todo.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' :
                        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200'
                      }`}
                    >
                      <option value="todo">A Fazer</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="done">Concluído</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className={`font-medium ${todo.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {todo.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[todo.priority]}`}>
                      {PRIORITY_LABELS[todo.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {todo.dueDate ? format(new Date(todo.dueDate), 'dd/MM/yyyy', { locale: pt }) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {todo.collaborators?.length > 0 ? (
                      <div className="flex -space-x-2">
                        {todo.collaborators.slice(0, 3).map((collab) => (
                          <div
                            key={collab.id}
                            className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800"
                            title={collab.user?.name}
                          >
                            {collab.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {todo.collaborators.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs border-2 border-white dark:border-gray-800">
                            +{todo.collaborators.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {todo.isOwner && (
                        <button
                          onClick={() => handleOpenCollaborators(todo)}
                          className="p-1 text-gray-400 hover:text-primary-500"
                          title="Colaboradores"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTodo(todo)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {todo.isOwner && (
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTodos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma tarefa encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showModal && (
        <TodoModal
          todo={editingTodo}
          onSave={handleSaveTodo}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Modal de Colaboradores */}
      {showCollaboratorModal && selectedTodoForCollab && (
        <CollaboratorModal
          todo={selectedTodoForCollab}
          onClose={() => {
            setShowCollaboratorModal(false)
            setSelectedTodoForCollab(null)
            loadTodos()
          }}
        />
      )}
    </div>
  )
}
