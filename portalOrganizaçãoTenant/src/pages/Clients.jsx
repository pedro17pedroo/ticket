import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Eye, UserX, UserCheck, Search, Mail, Phone, X, Building2, Lock, Save, Settings } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'

const Clients = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await api.get('/clients-b2b', { params: { search } })
      setClients(response.data.clients || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await api.put(`/clients-b2b/${editingClient.id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          isActive: formData.isActive
        })
        showSuccess('Atualizado!', 'Cliente atualizado com sucesso')
      } else {
        await api.post('/clients-b2b', formData)
        showSuccess('Criado!', 'Cliente criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadClients()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      password: '',
      isActive: client.isActive
    })
    setShowModal(true)
  }

  const handleDeactivate = async (id) => {
    const confirmed = await confirmDelete(
      'Desativar cliente?',
      'O cliente não poderá mais fazer login.'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/clients-b2b/${id}`)
      showSuccess('Desativado!', 'Cliente desativado com sucesso')
      loadClients()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleActivate = async (id) => {
    try {
      await api.put(`/clients-b2b/${id}/activate`)
      showSuccess('Ativado!', 'Cliente reativado com sucesso')
      loadClients()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true
    })
    setEditingClient(null)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir clientes da organização</p>
        </div>
        <PermissionGate permission="clients.create">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar clientes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Cliente</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Contacto</th>
              <th className="text-center px-6 py-3 text-sm font-medium">Tickets</th>
              <th className="text-center px-6 py-3 text-sm font-medium">Estado</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {client.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {client.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {client.ticketCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {client.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => navigate(`/clients/${client.id}`)} 
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" 
                      title="Ver detalhes e gerir utilizadores">
                      <Eye className="w-4 h-4" />
                    </button>
                    <PermissionGate permission="clients.update">
                      <button onClick={() => handleEdit(client)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="clients.delete">
                      {client.isActive ? (
                        <button onClick={() => handleDeactivate(client.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg" title="Desativar">
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(client.id)} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 rounded-lg" title="Reativar">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingClient
                    ? 'Atualize as informações do cliente'
                    : 'Adicione um novo cliente à organização'
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
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="clientForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-500" />
                    Informações do Cliente
                  </h3>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nome da Empresa *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="Ex: Empresa ABC, Lda"
                    />
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="contacto@empresa.com"
                    />
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="+244 9XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Card: Credenciais (apenas ao criar) */}
                {!editingClient && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary-500" />
                      Credenciais de Acesso
                    </h3>

                    <div className="max-w-2xl">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                        placeholder="••••••••••••"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Esta será a senha inicial do administrador do cliente</p>
                    </div>
                  </div>
                )}

                {/* Card: Configurações (apenas ao editar) */}
                {editingClient && (
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
                        <span className="font-medium">Cliente Ativo</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive ? 'Pode aceder ao sistema' : 'Acesso ao sistema bloqueado'}
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
                form="clientForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingClient ? 'Atualizar' : 'Criar'} Cliente
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Clients
