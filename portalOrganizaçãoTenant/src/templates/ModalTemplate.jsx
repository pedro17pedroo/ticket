/**
 * 📋 TEMPLATE DE MODAL PADRÃO - TatuTicket
 * 
 * Este é um template de referência para criar novos modais.
 * SEMPRE use este padrão ao criar modais na aplicação.
 * 
 * Documentação: /MODAL-PATTERN-GUIDE.md
 * 
 * USO:
 * 1. Copie este arquivo
 * 2. Renomeie para o nome do seu componente
 * 3. Ajuste o conteúdo conforme necessário
 * 4. Mantenha a estrutura do Modal com Portal
 */

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'

const MeuComponente = () => {
  // Estados
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  // Carregar dados
  const loadData = async () => {
    try {
      const response = await api.get('/endpoint')
      setItems(response.data.items || [])
    } catch (error) {
      showError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    })
    setEditingItem(null)
  }

  // Fechar modal
  const handleClose = () => {
    setShowModal(false)
    resetForm()
  }

  // Abrir modal para criar
  const handleCreate = () => {
    resetForm()
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      isActive: item.isActive
    })
    setShowModal(true)
  }

  // Salvar (criar ou editar)
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingItem) {
        await api.put(`/endpoint/${editingItem.id}`, formData)
        showSuccess('Item atualizado com sucesso!')
      } else {
        await api.post('/endpoint', formData)
        showSuccess('Item criado com sucesso!')
      }
      
      handleClose()
      loadData()
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao salvar item')
    }
  }

  // Deletar
  const handleDelete = async (id) => {
    if (await confirmDelete()) {
      try {
        await api.delete(`/endpoint/${id}`)
        showSuccess('Item excluído com sucesso!')
        loadData()
      } catch (error) {
        showError('Erro ao excluir item')
      }
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Título da Página</h1>
          <p className="text-gray-500 dark:text-gray-400">Descrição da página</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Item
        </button>
      </div>

      {/* Lista/Tabela de itens */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border">
        {/* Seu conteúdo aqui */}
      </div>

      {/* 
        ═══════════════════════════════════════════════════════════
        MODAL - PADRÃO OBRIGATÓRIO COM REACT PORTAL
        ═══════════════════════════════════════════════════════════
        
        ✅ SEMPRE use o componente <Modal>
        ✅ Renderiza via Portal no body
        ✅ Z-index automático (9999)
        ✅ Backdrop com blur
        ✅ Fecha com ESC
        ✅ Bloqueia scroll
      */}
      <Modal isOpen={showModal} onClose={handleClose}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header do Modal */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body do Modal */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Campo: Nome */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Digite o nome"
              />
            </div>

            {/* Campo: Descrição */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Digite a descrição"
              />
            </div>

            {/* Campo: Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-500 rounded"
              />
              <label className="text-sm font-medium">Ativo</label>
            </div>

            {/* Footer com Botões */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {editingItem ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>

        </div>
      </Modal>
    </div>
  )
}

export default MeuComponente
