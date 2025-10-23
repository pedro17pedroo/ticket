import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, UserCheck, Mail, Phone, Search, X, Key } from 'lucide-react'
import api, { clientUserService } from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import { useAuthStore } from '../store/authStore'
import Swal from 'sweetalert2'

const Users = () => {
  const { user } = useAuthStore()
  const isClientAdmin = user?.role === 'cliente-org' && user?.settings?.clientAdmin === true

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await clientUserService.getAll()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await clientUserService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          isActive: formData.isActive
        })
        showSuccess('Atualizado!', 'Utilizador atualizado com sucesso')
      } else {
        await clientUserService.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
        showSuccess('Criado!', 'Utilizador criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (u) => {
    setEditingUser(u)
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      isActive: u.isActive
    })
    setShowModal(true)
  }

  const handleDeactivate = async (id) => {
    const confirmed = await confirmDelete('Desativar utilizador?', 'O utilizador não poderá mais fazer login.')
    if (!confirmed) return
    try {
      await clientUserService.remove(id)
      showSuccess('Desativado!', 'Utilizador desativado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleActivate = async (id) => {
    try {
      await clientUserService.activate(id)
      showSuccess('Ativado!', 'Utilizador reativado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleResetPassword = async (u) => {
    const { value: password } = await Swal.fire({
      title: `Redefinir senha de ${u.name}`,
      input: 'password',
      inputLabel: 'Nova senha (mínimo 6 caracteres)',
      inputPlaceholder: 'Digite a nova senha',
      inputAttributes: { minlength: 6, autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Redefinir',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) return 'A senha deve ter no mínimo 6 caracteres'
      }
    })

    if (password) {
      try {
        await clientUserService.resetPassword(u.id, password)
        showSuccess('Senha redefinida!', 'A senha foi redefinida com sucesso')
      } catch (error) {
        showError('Erro', error.response?.data?.error || error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', isActive: true })
    setEditingUser(null)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (!isClientAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="text-gray-600 mt-2">A gestão de utilizadores está disponível apenas para administradores do cliente.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Utilizadores do Cliente</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir utilizadores que podem abrir e acompanhar tickets</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
          <Plus className="w-5 h-5" /> Novo Utilizador
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Pesquisar por nome ou email..." className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Utilizador</th>
              <th className="text-center px-6 py-3 text-sm font-medium">Estado</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {u.email}
                    </div>
                    {u.phone && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {u.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(u)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleResetPassword(u)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-orange-600" title="Redefinir senha">
                      <Key className="w-4 h-4" />
                    </button>
                    {u.isActive ? (
                      <button onClick={() => handleDeactivate(u.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Desativar">
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(u.id)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg" title="Reativar">
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhum utilizador encontrado.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <input type="text" value={formData.name} onChange={(e)=>setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" value={formData.email} onChange={(e)=>setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input type="tel" value={formData.phone} onChange={(e)=>setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Password *</label>
                    <input type="password" value={formData.password} onChange={(e)=>setFormData({ ...formData, password: e.target.value })} minLength={6} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
                  </div>
                )}
              </div>

              {editingUser && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={(e)=>setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                  <label className="text-sm">Ativo</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingUser ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
