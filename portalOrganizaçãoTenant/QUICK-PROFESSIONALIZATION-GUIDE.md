# 🚀 Guia Rápido de Profissionalização - Modais Restantes

## ✅ Status: 5/10 Concluídos (50%)

### Profissionalizados ✅
1. CatalogCategories.jsx
2. Users.jsx
3. Directions.jsx
4. Departments.jsx
5. Sections.jsx

### Pendentes ⏳
6. Categories.jsx - PRÓXIMO
7. SLAs.jsx
8. Priorities.jsx
9. Types.jsx
10. CatalogApprovals.jsx (2 modais)

---

## 📋 Template de Conversão Rápida

### PASSO 1: Importar Ícones Adicionais

```jsx
// ANTES
import { Plus, Edit2, Trash2, Icon, X } from 'lucide-react'

// DEPOIS - Adicionar:
import { Plus, Edit2, Trash2, Icon, X, Save, FileText, Settings } from 'lucide-react'
```

### PASSO 2: Substituir Estrutura do Modal

```jsx
// ANTES
<Modal isOpen={showModal} onClose={onClose}>
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
    <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Novo'}</h2>
    <form onSubmit={handleSubmit}>
      {/* campos */}
      <div className="flex gap-3">
        <button onClick={onClose}>Cancelar</button>
        <button type="submit">Criar</button>
      </div>
    </form>
  </div>
</Modal>

// DEPOIS
<Modal isOpen={showModal} onClose={onClose}>
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
    
    {/* Header gradiente */}
    <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon className="w-6 h-6" />
            {editing ? 'Editar' : 'Novo'} Item
          </h2>
          <p className="text-primary-100 text-sm mt-1">
            Descrição contextual
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
    
    {/* Content scrollável */}
    <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
      <div className="bg-gray-50 dark:bg-gray-900 p-6">
        <form id="formId" onSubmit={handleSubmit} className="space-y-5">
          
          {/* Card 1: Informações Básicas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Informações Básicas
            </h3>
            {/* campos */}
          </div>
          
          {/* Card 2: Configurações (opcional, apenas ao editar) */}
          {editing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-500" />
                Configurações
              </h3>
              <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={isActive} className="w-5 h-5 text-primary-500 rounded" />
                <div className="flex-1">
                  <span className="font-medium">Ativo</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isActive ? 'Visível e operacional' : 'Oculto e inativo'}
                  </p>
                </div>
              </label>
            </div>
          )}
          
        </form>
      </div>
    </div>
    
    {/* Footer fixo */}
    <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" form="formId" className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
          <Save className="w-5 h-5" />
          {editing ? 'Atualizar' : 'Criar'} Item
        </button>
      </div>
    </div>
    
  </div>
</Modal>
```

---

## 🎨 Ícones por Modal

| Modal | Header Icon | Card Icon |
|-------|-------------|-----------|
| Categories.jsx | FolderOpen | FileText |
| SLAs.jsx | Clock | FileText |
| Priorities.jsx | AlertCircle | FileText, Palette |
| Types.jsx | FileType | FileText |

---

## 💡 Dicas Rápidas

1. **Copie de Directions.jsx** - Estrutura mais simples e completa
2. **Ajuste max-w** - Use `max-w-2xl` para modais simples, `max-w-3xl` para complexos
3. **Form ID** - Sempre único: `categoryForm`, `slaForm`, `priorityForm`, `typeForm`
4. **Descrições** - Customize a descrição do header para cada contexto

---

## ✅ Checklist Por Modal

- [ ] Importar ícones: Save, FileText, Settings, [IconEspecífico]
- [ ] Header com gradiente e ícone
- [ ] Descrição contextual
- [ ] Cards com títulos e ícones
- [ ] Campos com classes atualizadas (py-2.5, focus:ring-2)
- [ ] Footer com botões profissionais
- [ ] Form ID único
- [ ] Testar em dark mode

---

**Status:** 5/10 completos - Continuar com Categories.jsx next!
