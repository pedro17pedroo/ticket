# 📚 Guia do Catálogo de Serviços - T-Desk

## 🎯 Visão Geral

O Catálogo de Serviços do T-Desk é organizado em **3 níveis hierárquicos**:

```
📁 Categorias Raiz (Nível 1)
   └─ 📁 Subcategorias (Nível 2+)
       └─ 📄 Itens/Serviços (Ofertas)
```

---

## 🔄 Fluxo de Criação Completo

### **1️⃣ Criar Categorias Raiz (Nível 1)**

**Onde:** Menu Lateral → **Catálogo de Serviços** → **Categorias**

**URL:** `http://localhost:5173/catalog/categories`

**Como:**
1. Clique em **"+ Nova Categoria"**
2. Preencha o nome (ex: "Hardware", "Software", "Suporte")
3. Adicione descrição, ícone e cor
4. Em **"Categoria Pai"**, deixe como **"Nenhuma (Categoria Raiz - Nível 1)"**
5. Clique em **"Criar Categoria"**

**Exemplo:**
```
🖥️ Hardware
💾 Software  
🛠️ Suporte Técnico
📱 Telefonia
```

---

### **2️⃣ Criar Subcategorias (Nível 2+)**

**Onde:** Menu Lateral → **Catálogo de Serviços** → **Categorias**

**URL:** `http://localhost:5173/catalog/categories`

**Como:**
1. Clique em **"+ Nova Categoria"**
2. Preencha o nome (ex: "Impressoras", "Computadores")
3. Em **"Categoria Pai"**, selecione a categoria raiz (ex: "Hardware")
4. Clique em **"Criar Categoria"**

**Exemplo de Hierarquia:**
```
🖥️ Hardware
   └─ 🖨️ Impressoras
   └─ 💻 Computadores
   └─ 📷 Periféricos

💾 Software
   └─ 🎨 Design
   └─ 📊 Produtividade
```

---

### **3️⃣ Criar Itens/Serviços**

**Onde:** Menu Lateral → **Catálogo de Serviços** → **Itens/Serviços** (primeiro item do submenu!)

**URL:** `http://localhost:5173/catalog`

**Como:**
1. Clique em **"+ Novo Item"**
2. Selecione a **Categoria** onde o item ficará
3. Preencha:
   - Nome do serviço (ex: "Instalação de Impressora HP")
   - Descrição detalhada
   - Preço (opcional)
   - Campos personalizados do formulário
   - Configurações de aprovação
4. Clique em **"Criar Item"**

**Exemplo de Item:**
```
Categoria: Hardware > Impressoras
Item: "Instalação de Impressora HP LaserJet"
Descrição: Instalação e configuração completa
Campos: [Modelo], [Localização], [Urgência]
```

---

## 📋 Resumo Visual

```
PASSO 1: Categorias (Menu Lateral)
┌─────────────────────────────────┐
│ 📁 Categorias                   │
│                                 │
│ ✅ Hardware                     │  ← Categoria Raiz
│ ✅ Software                     │  ← Categoria Raiz
│    └─ Design                    │  ← Subcategoria
│    └─ Produtividade             │  ← Subcategoria
└─────────────────────────────────┘

PASSO 2: Itens/Serviços (Menu Lateral)
┌─────────────────────────────────┐
│ 📄 Catálogo de Serviços         │
│                                 │
│ ✅ Instalação Impressora        │  ← Item em Hardware
│ ✅ Suporte Adobe Photoshop      │  ← Item em Software > Design
│ ✅ Licença Microsoft 365        │  ← Item em Software > Produtividade
└─────────────────────────────────┘
```

---

## ❓ Perguntas Frequentes

### **P: Por que não vejo opções de categoria pai?**
**R:** Você precisa criar pelo menos uma categoria raiz primeiro. Deixe "Categoria Pai" em branco para criar a primeira.

### **P: Onde crio os serviços/itens que os usuários vão solicitar?**
**R:** No menu **"Catálogo de Serviços"** (não em "Categorias"). As categorias são apenas para organização.

### **P: Quantos níveis de hierarquia posso ter?**
**R:** Ilimitados! Você pode ter Categoria > Subcategoria > Sub-subcategoria > ...

### **P: Posso mover um item de categoria depois de criado?**
**R:** Sim! Edite o item e selecione outra categoria.

---

## 🎨 Boas Práticas

### ✅ Recomendado:
- Use **categorias raiz** para grandes áreas (ex: Hardware, Software, RH)
- Use **subcategorias** para especificar (ex: Hardware > Impressoras, Hardware > Notebooks)
- Crie **itens/serviços** específicos e claros (ex: "Instalação de Impressora HP LaserJet")
- Use **ícones emoji** relevantes para fácil identificação

### ❌ Evite:
- Criar muitos níveis de hierarquia (máximo 3-4 níveis)
- Nomes genéricos de itens (ex: "Suporte")
- Deixar categorias vazias sem itens

---

## 🚀 Exemplo Completo de Setup

```
📁 Hardware (Nível 1)
   └─ 🖨️ Impressoras (Nível 2)
       └─ 📄 "Instalação de Impressora HP LaserJet" (Item)
       └─ 📄 "Manutenção Preventiva de Impressora" (Item)
   └─ 💻 Computadores (Nível 2)
       └─ 📄 "Formatação de Notebook" (Item)
       └─ 📄 "Upgrade de Memória RAM" (Item)

💾 Software (Nível 1)
   └─ 🎨 Design (Nível 2)
       └─ 📄 "Licença Adobe Creative Cloud" (Item)
       └─ 📄 "Suporte Photoshop" (Item)
   └─ 📊 Produtividade (Nível 2)
       └─ 📄 "Licença Microsoft 365" (Item)
```

---

## 🛠️ Navegação no Sistema

### Menu Lateral → Catálogo de Serviços:
- 📦 **Itens/Serviços** (`/catalog`) → Gerenciar itens/serviços que os usuários solicitam
- 📁 **Categorias** (`/catalog/categories`) → Gerenciar categorias raiz e subcategorias
- 👍 **Aprovações** (`/catalog/approvals`) → Aprovar/rejeitar solicitações
- 📊 **Analytics** (`/catalog/analytics`) → Estatísticas de uso

---

## 📞 Suporte

Se tiver dúvidas sobre o fluxo, consulte este guia ou entre em contato com o administrador do sistema.

**Última atualização:** 2025-01-08
