import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, Save, UserPlus, Mail, Phone, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { confirmDelete, showSuccess, showError } from '../../utils/alerts'
import organizationService from '../../services/organizationService'
import toast from 'react-hot-toast'

const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client-user',
    directionId: '',
    departmentId: '',
    sectionId: ''
  })
  const [saving, setSaving] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Organizational data
  const [directions, setDirections] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [allDepartments, setAllDepartments] = useState([])
  const [allSections, setAllSections] = useState([])

  useEffect(() => {
    loadUsers()
    loadOrganizationalData()
    
    // Cleanup function para restaurar scroll se o componente for desmontado
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Effect para controlar modal
  useEffect(() => {
    if (showModal) {
      // Prevenir scroll quando modal está aberto
      document.body.style.overflow = 'hidden'
      
      // Handler para ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCloseModal()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showModal])

  const loadOrganizationalData = async () => {
    try {
      const [directionsRes, departmentsRes, sectionsRes] = await Promise.all([
        organizationService.getDirections(),
        organizationService.getDepartments(),
        organizationService.getSections()
      ])
      setDirections(directionsRes.data.directions || [])
      setAllDepartments(departmentsRes.data.departments || [])
      setAllSections(sectionsRes.data.sections || [])
    } catch (error) {
      console.error('Erro ao carregar dados organizacionais:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await organizationService.getClientUsers()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
      toast.error('Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      const userData = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        directionId: user.directionId || '',
        departmentId: user.departmentId || '',
        sectionId: user.sectionId || ''
      }
      setFormData(userData)

      // Load dependent dropdowns
      if (userData.directionId) {
        filterDepartmentsByDirection(userData.directionId)
      }
      if (userData.departmentId) {
        filterSectionsByDepartment(userData.departmentId)
      }
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'client-user',
        directionId: '',
        departmentId: '',
        sectionId: ''
      })
      setDepartments([])
      setSections([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', phone: '', role: 'client-user', directionId: '', departmentId: '', sectionId: '' })
    setDepartments([])
    setSections([])
  }

  const filterDepartmentsByDirection = (directionId) => {
    if (directionId) {
      console.log('Filtrando departamentos por directionId:', directionId)
      console.log('Todos os departamentos:', allDepartments)
      const filtered = allDepartments.filter(d => {
        const match = String(d.directionId) === String(directionId)
        console.log(`Dept ${d.name} (directionId: ${d.directionId}) matches: ${match}`)
        return match
      })
      console.log('Departamentos filtrados:', filtered)
      setDepartments(filtered)
    } else {
      setDepartments([])
    }
  }

  const filterSectionsByDepartment = (departmentId) => {
    if (departmentId) {
      console.log('Filtrando secções por departmentId:', departmentId)
      console.log('Todas as secções:', allSections)
      const filtered = allSections.filter(s => {
        const match = String(s.departmentId) === String(departmentId)
        console.log(`Section ${s.name} (departmentId: ${s.departmentId}) matches: ${match}`)
        return match
      })
      console.log('Secções filtradas:', filtered)
      setSections(filtered)
    } else {
      setSections([])
    }
  }

  const handleDirectionChange = (directionId) => {
    setFormData({
      ...formData,
      directionId,
      departmentId: '',
      sectionId: ''
    })
    filterDepartmentsByDirection(directionId)
    setSections([])
  }

  const handleDepartmentChange = (departmentId) => {
    setFormData({
      ...formData,
      departmentId,
      sectionId: ''
    })
    filterSectionsByDepartment(departmentId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingUser) {
        await organizationService.updateClientUser(editingUser.id, formData)
        toast.success('Utilizador atualizado com sucesso!')
      } else {
        const response = await organizationService.createClientUser(formData)
        if (response.data.user.tempPassword) {
          toast.success(`Utilizador criado! Senha temporária: ${response.data.user.tempPassword}`, {
            duration: 10000
          })
        } else {
          toast.success('Utilizador criado com sucesso!')
        }
      }
      handleCloseModal()
      loadUsers()
    } catch (error) {
      console.error('Erro ao salvar utilizador:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar utilizador')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = await confirmDelete(
      'Desativar utilizador?',
      `Tem certeza que deseja desativar o utilizador ${user.name}?`
    )

    if (!confirmed) return

    try {
      await organizationService.deleteClientUser(user.id)
      toast.success('Utilizador desativado com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Erro ao desativar utilizador:', error)
      toast.error(error.response?.data?.error || 'Erro ao desativar utilizador')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Reset to page 1 when search changes or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
  }

  if (loading) {
    return <div className="text-center py-8">A carregar...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar utilizadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Novo Utilizador
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Organização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Nenhum utilizador encontrado
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-xs">
                      {user.direction && (
                        <div className="text-blue-600 dark:text-blue-400">📍 {user.direction.name}</div>
                      )}
                      {user.department && (
                        <div className="text-orange-600 dark:text-orange-400">🏢 {user.department.name}</div>
                      )}
                      {user.section && (
                        <div className="text-green-600 dark:text-green-400">📁 {user.section.name}</div>
                      )}
                      {!user.direction && !user.department && !user.section && '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'client-admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                        {user.role === 'client-admin' ? 'Administrador' : 'Utilizador'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Desativar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {currentUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
            Nenhum utilizador encontrado
          </div>
        ) : (
          currentUsers.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${user.role === 'client-admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                  {user.role === 'client-admin' ? 'Admin' : 'User'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                {(user.direction || user.department || user.section) && (
                  <div className="space-y-1">
                    {user.direction && (
                      <div className="text-blue-600 dark:text-blue-400 text-xs">📍 {user.direction.name}</div>
                    )}
                    {user.department && (
                      <div className="text-orange-600 dark:text-orange-400 text-xs">🏢 {user.department.name}</div>
                    )}
                    {user.section && (
                      <div className="text-green-600 dark:text-green-400 text-xs">📁 {user.section.name}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleOpenModal(user)}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Desativar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination - Always show if there are users */}
      {filteredUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-gray-600 dark:text-gray-400">por página</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              A mostrar {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} utilizadores
            </div>

            {/* Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primeira página"
                >
                  ««
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded-lg text-sm min-w-[32px] ${
                            currentPage === pageNumber
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  »»
                </button>
              </div>
            )}
          </div>

          {/* Mobile pagination - simplified */}
          {totalPages > 1 && (
            <div className="sm:hidden mt-3 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && createPortal(
        <div 
          className="fixed bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 animate-in fade-in duration-200" 
          style={{ 
            zIndex: 999999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '8px'
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[calc(100vh-16px)] overflow-hidden"
            style={{ maxWidth: '1024px' }}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {editingUser ? <Edit className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                    {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                  </h2>
                  <p className="text-primary-100 text-sm mt-1">
                    {editingUser
                      ? 'Atualize as informações do utilizador do cliente'
                      : 'Adicione um novo utilizador ao cliente'
                    }
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
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
                <form id="userForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* Card: Informações Básicas */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-primary-500" />
                      Informações Básicas
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Ex: João Silva"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!editingUser}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="joao.silva@empresa.com"
                      />
                      {editingUser && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">O email não pode ser alterado</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+244 9XX XXX XXX"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Card: Perfil */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-500" />
                      Perfil e Função
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Perfil *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="client-user">Utilizador</option>
                        <option value="client-admin">Administrador</option>
                      </select>
                    </div>
                  </div>

                  {/* Card: Estrutura Organizacional */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-500" />
                      Estrutura Organizacional (Opcional)
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direção</label>
                      <select
                        value={formData.directionId}
                        onChange={(e) => handleDirectionChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Selecione uma direção</option>
                        {directions.map(dir => (
                          <option key={dir.id} value={dir.id}>{dir.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departamento</label>
                        <select
                          value={formData.departmentId}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!formData.directionId || departments.length === 0}
                        >
                          <option value="">Selecione um departamento</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                        {formData.directionId && departments.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nenhum departamento disponível nesta direção</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secção</label>
                        <select
                          value={formData.sectionId}
                          onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!formData.departmentId || sections.length === 0}
                        >
                          <option value="">Selecione uma secção</option>
                          {sections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                          ))}
                        </select>
                        {formData.departmentId && sections.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nenhuma secção disponível neste departamento</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">Defina a hierarquia organizacional do utilizador: Direção → Departamento → Secção</p>
                  </div>

                  {/* Card: Informação sobre senha */}
                  {!editingUser && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Credenciais
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Uma senha temporária será gerada automaticamente e exibida após a criação do utilizador.
                      </p>
                    </div>
                  )}

                </form>
              </div>
            </div>

            {/* Footer fixo com botões */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="userForm"
                  disabled={saving}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'A guardar...' : (editingUser ? 'Atualizar' : 'Criar')} Utilizador
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  )
}

export default UsersTab
