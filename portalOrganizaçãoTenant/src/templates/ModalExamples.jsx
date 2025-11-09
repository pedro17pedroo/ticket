/**
 * 📚 EXEMPLOS DE MODAIS - TatuTicket
 * 
 * Este arquivo contém exemplos práticos de diferentes tipos de modais.
 * Use como referência ao criar novos modais na aplicação.
 * 
 * Índice:
 * 1. Modal Pequeno (Confirmação)
 * 2. Modal Médio (Formulário Padrão)
 * 3. Modal Grande (Formulário Complexo)
 * 4. Modal Extra Grande (Visualização)
 * 5. Modal com Tabs
 * 6. Modal com Scroll Interno
 * 7. Modal de Aprovação
 */

import { useState } from 'react'
import { X, AlertTriangle, Save, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

const ModalExamples = () => {
  const [showSmallModal, setShowSmallModal] = useState(false)
  const [showMediumModal, setShowMediumModal] = useState(false)
  const [showLargeModal, setShowLargeModal] = useState(false)
  const [showXLModal, setShowXLModal] = useState(false)
  const [showTabModal, setShowTabModal] = useState(false)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Exemplos de Modais</h1>

      {/* Botões para abrir exemplos */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowSmallModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Modal Pequeno (Confirmação)
        </button>
        <button onClick={() => setShowMediumModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          Modal Médio (Formulário)
        </button>
        <button onClick={() => setShowLargeModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          Modal Grande (Complexo)
        </button>
        <button onClick={() => setShowXLModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg">
          Modal Extra Grande
        </button>
        <button onClick={() => setShowTabModal(true)} className="px-4 py-2 bg-pink-600 text-white rounded-lg">
          Modal com Tabs
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          EXEMPLO 1: MODAL PEQUENO - CONFIRMAÇÃO/ALERT
          max-w-md (448px)
          ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showSmallModal} onClose={() => setShowSmallModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
          {/* Ícone de Alerta */}
          <div className="flex justify-center pt-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Confirmar Exclusão?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir este item?
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSmallModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Ação de exclusão
                  setShowSmallModal(false)
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          EXEMPLO 2: MODAL MÉDIO - FORMULÁRIO PADRÃO
          max-w-2xl (672px) - TAMANHO MAIS COMUM
          ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showMediumModal} onClose={() => setShowMediumModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Novo Utilizador</h2>
            <button
              onClick={() => setShowMediumModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="joao@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Função</label>
              <select className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                <option>Selecione...</option>
                <option>Administrador</option>
                <option>Agente</option>
                <option>Cliente</option>
              </select>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowMediumModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Criar
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          EXEMPLO 3: MODAL GRANDE - FORMULÁRIO COMPLEXO
          max-w-3xl (768px)
          ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showLargeModal} onClose={() => setShowLargeModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header Fixo */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Nova Categoria</h2>
                <p className="text-primary-100 text-sm mt-1">
                  Configure todos os detalhes da categoria
                </p>
              </div>
              <button
                onClick={() => setShowLargeModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Card 1 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border">
                <h3 className="font-semibold mb-4">📝 Informações Básicas</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nome da categoria"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                  <textarea
                    placeholder="Descrição"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border">
                <h3 className="font-semibold mb-4">🎨 Aparência</h3>
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="Ícone" className="px-4 py-2 border rounded-lg" />
                  <input type="color" className="px-4 py-2 border rounded-lg" />
                  <input type="url" placeholder="URL Imagem" className="px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setShowLargeModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">
                Salvar Categoria
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          EXEMPLO 4: MODAL EXTRA GRANDE - VISUALIZAÇÃO
          max-w-5xl (1024px)
          ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showXLModal} onClose={() => setShowXLModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Detalhes da Solicitação #1234</h2>
              <button onClick={() => setShowXLModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conteúdo detalhado aqui...
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Histórico</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Timeline aqui...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          EXEMPLO 5: MODAL COM TABS
          ═══════════════════════════════════════════════════════════ */}
      <Modal isOpen={showTabModal} onClose={() => setShowTabModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Configurações</h2>
              <button onClick={() => setShowTabModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button className="px-4 py-2 border-b-2 border-primary-500 font-medium">
                Geral
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-900">
                Avançado
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-900">
                Permissões
              </button>
            </div>

            {/* Conteúdo da Tab */}
            <div className="space-y-4">
              <p>Conteúdo da aba selecionada...</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ModalExamples
