# 🎨 Guia de Padrão de Modal - Portal Cliente Empresa

## 📦 Componente Oficial

**Localização:** `/src/components/Modal.jsx`

**Tecnologia:** React Portal (renderiza no `body`, fora da hierarquia DOM)

---

## ✅ Uso Obrigatório

**SEMPRE** usar o componente `Modal` para qualquer modal na aplicação:

```jsx
import Modal from '../components/Modal'

<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
    {/* Conteúdo do modal */}
  </div>
</Modal>
```

---

## ❌ NUNCA Usar

- ❌ Divs com `fixed` e `z-index` manual
- ❌ Modais renderizados diretamente no componente
- ❌ Classes CSS customizadas para backdrop
- ❌ Backdrop com `bg-black/50` ou valores diferentes de `bg-black/60`

---

## 🎯 Funcionalidades Automáticas

- ✅ **Z-index:** 9999 (sempre acima de tudo)
- ✅ **Backdrop:** `bg-black/60` com `backdrop-blur-sm`
- ✅ **Fecha com ESC:** Automático
- ✅ **Bloqueia scroll:** Página não rola quando modal aberto
- ✅ **Animações:** Fade-in e zoom-in suaves
- ✅ **Dark mode:** Suporte nativo
- ✅ **Portal:** Renderiza no `body`, evitando problemas de z-index

---

## 📏 Tamanhos Padrão

| Tamanho | Classe | Largura |
|---------|--------|---------|
| **Pequeno** | `max-w-md` | 448px |
| **Médio** | `max-w-2xl` | 672px ⭐ **Padrão** |
| **Grande** | `max-w-4xl` | 896px |
| **Extra Grande** | `max-w-6xl` | 1152px |

---

## 🎨 Estrutura Padrão Profissionalizada

### Modal com Header Azul

```jsx
<Modal isOpen={showModal} onClose={handleClose}>
  {data && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header gradiente azul */}
      <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.title}</h2>
            <p className="text-sm text-blue-100 mt-0.5">{data.subtitle}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Conteúdo aqui */}
      </div>
      
      {/* Footer sticky */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )}
</Modal>
```

---

## 🎯 Páginas de Referência

- ✅ **ServiceCatalogEnhanced.jsx** - Modal de solicitação de serviço

---

## 🔍 Checklist de Qualidade

Antes de criar um novo modal, verifique:

- [ ] Importou o componente `Modal`?
- [ ] Usou `isOpen` e `onClose` corretamente?
- [ ] O backdrop é `bg-black/60 backdrop-blur-sm`?
- [ ] O conteúdo tem verificação `{data && ...}` quando necessário?
- [ ] O header usa `bg-blue-600`?
- [ ] Os botões têm estados de hover e disabled?
- [ ] O modal é responsivo (`max-w-*`)?
- [ ] O conteúdo rola quando necessário (`overflow-y-auto`)?

---

## 💡 Dicas

### Prevenir Erros de Null

Sempre envolva o conteúdo do modal com verificação quando depender de dados:

```jsx
<Modal isOpen={showModal && data} onClose={handleClose}>
  {data && (
    <div className="bg-white dark:bg-gray-800 ...">
      {/* Conteúdo usando data.* */}
    </div>
  )}
</Modal>
```

### Animações

O Modal já inclui animações automáticas:
- `fade-in` para o backdrop
- `zoom-in-95` para o conteúdo

Não adicione animações customizadas que possam conflitar.

### Dark Mode

O componente Modal suporta dark mode automaticamente. Use classes como:
- `dark:bg-gray-800`
- `dark:text-white`
- `dark:border-gray-700`

---

## 📐 Motivo do Padrão

1. **Backdrop consistente:** `bg-black/60 backdrop-blur-sm` cria uma sobreposição profissional
2. **Portal:** Renderiza no `body`, evitando problemas de z-index e overflow
3. **Acessibilidade:** Fecha com ESC e bloqueia scroll automaticamente
4. **Manutenibilidade:** Um único componente para todos os modais
5. **UX:** Animações e transições suaves

---

## 🚨 Problemas Comuns

### Modal não aparece acima do header/sidebar

**Causa:** Modal renderizado dentro do Layout  
**Solução:** O Modal usa Portal e z-index 9999, sempre aparece acima

### Backdrop muito claro/escuro

**Causa:** Classe incorreta  
**Solução:** Usar exatamente `bg-black/60 backdrop-blur-sm`

### Conteúdo não rola

**Causa:** Faltou `overflow-y-auto` no body do modal  
**Solução:** Adicionar `overflow-y-auto` no container do conteúdo

---

**Criado em:** 09/11/2025  
**Última atualização:** 09/11/2025
