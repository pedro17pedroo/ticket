# 📖 Guia de Padrão de Modais - T-Desk

## 🎯 Objetivo
Este documento define o padrão **obrigatório** para implementação de modais em toda a aplicação, garantindo consistência, performance e melhor experiência do usuário.

---

## ✅ Padrão Obrigatório: React Portal

**SEMPRE** use o componente `<Modal>` criado em `/src/components/Modal.jsx` para qualquer modal na aplicação.

### ❌ **NUNCA FAÇA ISSO:**
```jsx
// ❌ ERRADO - Modal renderizado dentro do componente
{showModal && (
  <div className="fixed inset-0 bg-black/60 z-50">
    <div className="bg-white rounded-lg">
      {/* conteúdo */}
    </div>
  </div>
)}
```

### ✅ **SEMPRE FAÇA ISSO:**
```jsx
import Modal from '../components/Modal'

// ✅ CORRETO - Usando o componente Modal com Portal
<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
    {/* conteúdo do modal */}
  </div>
</Modal>
```

---

## 🔧 Como Usar o Componente Modal

### 1. **Importar o Componente**
```jsx
import Modal from '../components/Modal'
```

### 2. **Criar Estado para Controlar o Modal**
```jsx
const [showModal, setShowModal] = useState(false)
```

### 3. **Renderizar o Modal**
```jsx
<Modal 
  isOpen={showModal} 
  onClose={() => {
    setShowModal(false)
    // Adicione aqui qualquer lógica de reset necessária
  }}
>
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Seu conteúdo aqui */}
  </div>
</Modal>
```

---

## 📋 Propriedades do Componente Modal

| Propriedade | Tipo | Obrigatório | Descrição |
|------------|------|-------------|-----------|
| `isOpen` | `boolean` | ✅ Sim | Controla se o modal está visível |
| `onClose` | `function` | ✅ Sim | Função chamada ao fechar (ESC ou click fora) |
| `children` | `ReactNode` | ✅ Sim | Conteúdo do modal |

---

## 🎨 Classes CSS Recomendadas para Conteúdo

### **Container Principal**
```jsx
className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
```

### **Header do Modal**
```jsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-2xl font-bold">Título do Modal</h2>
  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
    <X className="w-5 h-5" />
  </button>
</div>
```

### **Footer com Botões**
```jsx
<div className="flex gap-3 mt-6">
  <button 
    onClick={onClose}
    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
  >
    Cancelar
  </button>
  <button 
    type="submit"
    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
  >
    Confirmar
  </button>
</div>
```

---

## 🏗️ Estrutura Completa de Exemplo

```jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import Modal from '../components/Modal'

const MeuComponente = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: ''
  })

  const resetForm = () => {
    setFormData({ nome: '', email: '' })
  }

  const handleClose = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Lógica de submissão
    handleClose()
  }

  return (
    <div>
      {/* Botão para abrir modal */}
      <button onClick={() => setShowModal(true)}>
        Abrir Modal
      </button>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={handleClose}>
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold">Novo Item</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

export default MeuComponente
```

---

## 🎯 Funcionalidades Automáticas do Modal

O componente `<Modal>` já inclui automaticamente:

✅ **React Portal** - Renderiza no `body` fora do Layout  
✅ **Z-Index Máximo** - Sempre acima de todos os elementos (`z-9999`)  
✅ **Backdrop Escuro** - `bg-black/60` com `backdrop-filter: blur(4px)`  
✅ **Fecha com ESC** - Pressionar ESC fecha o modal  
✅ **Bloqueia Scroll** - Previne scroll da página quando aberto  
✅ **Animações Suaves** - `fade-in` automático  
✅ **Dark Mode** - Suporte completo  

---

## 📊 Tamanhos Recomendados

### **Pequeno (Formulários Simples)**
```jsx
max-w-md w-full  // ~448px
```

### **Médio (Formulários Padrão)**
```jsx
max-w-2xl w-full  // ~672px
```

### **Grande (Formulários Complexos)**
```jsx
max-w-3xl w-full  // ~768px
```

### **Extra Grande (Visualizações Detalhadas)**
```jsx
max-w-5xl w-full  // ~1024px
```

---

## ⚠️ Regras Importantes

### 1. **NUNCA use z-index manualmente**
O componente Modal já gerencia o z-index correto.

### 2. **SEMPRE resete o formulário ao fechar**
```jsx
const handleClose = () => {
  setShowModal(false)
  resetForm() // ✅ Sempre limpe os dados
}
```

### 3. **Use max-height para conteúdo longo**
```jsx
className="max-h-[90vh] overflow-y-auto"
```

### 4. **Evite modais dentro de modais**
Se necessário, use `z-[10000]` no segundo modal, mas considere alternativas.

---

## 🚀 Páginas Já Atualizadas (Exemplos)

As seguintes páginas já seguem este padrão:

1. ✅ `/pages/Users.jsx` - Modal de utilizadores
2. ✅ `/pages/Directions.jsx` - Modal de direções
3. ✅ `/pages/Departments.jsx` - Modal de departamentos
4. ✅ `/pages/Sections.jsx` - Modal de secções
5. ✅ `/pages/Categories.jsx` - Modal de categorias
6. ✅ `/pages/SLAs.jsx` - Modal de SLAs
7. ✅ `/pages/Priorities.jsx` - Modal de prioridades
8. ✅ `/pages/Types.jsx` - Modal de tipos
9. ✅ `/pages/CatalogCategories.jsx` - Modal de categorias do catálogo
10. ✅ `/pages/CatalogApprovals.jsx` - Modais de aprovação e detalhes

**Consulte estes arquivos como referência!**

---

## 🔍 Checklist de Implementação

Ao criar um novo modal, verifique:

- [ ] Importei `Modal` de `'../components/Modal'`?
- [ ] Criei um estado `showModal` com `useState(false)`?
- [ ] Passei `isOpen` e `onClose` como props?
- [ ] O conteúdo está dentro de um `div` com classes apropriadas?
- [ ] Implementei função de reset ao fechar?
- [ ] Testei fechar com ESC?
- [ ] Testei em dark mode?
- [ ] O backdrop cobre toda a tela (incluindo header)?

---

## 📞 Suporte

Se tiver dúvidas ou encontrar problemas:
1. Consulte os exemplos nas páginas listadas acima
2. Verifique o código do componente em `/src/components/Modal.jsx`
3. Revise este guia completo

---

**Última atualização:** 08/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Padrão Oficial da Aplicação
