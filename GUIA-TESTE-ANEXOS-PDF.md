# Guia de Teste: Anexos e Visualização de PDFs

**Data:** 2026-03-09  
**Versão:** 1.0

---

## 🎯 Objetivo

Testar as correções implementadas para:
1. Anexos de comentários aparecerem inline nas Atividades
2. PDFs abrirem em visualização inline (não fazer download automático)

---

## 📋 Pré-requisitos

1. ✅ Backend rodando na porta 4003
2. ✅ Frontend (Portal Organização) rodando na porta 5173
3. ✅ Usuário autenticado no Portal Organização
4. ✅ Arquivos de teste preparados:
   - PDF de teste (ex: `documento.pdf`)
   - Imagem de teste (ex: `imagem.jpg`)
   - Arquivo de texto (ex: `notas.txt`)

---

## 🧪 Teste 1: Anexos de Comentários Inline

### Objetivo
Verificar que anexos adicionados em comentários aparecem inline nas Atividades, não na seção "Anexos do Ticket"

### Passos

1. **Criar ou abrir um ticket existente**
   ```
   Portal Organização → Tickets → Abrir ticket
   ```

2. **Adicionar comentário COM anexo**
   - Rolar até a seção "Atividades"
   - No formulário de comentário:
     - Deixar o campo de comentário VAZIO ou adicionar texto
     - Clicar em "Escolher arquivos" na seção "Anexos (opcional)"
     - Selecionar um arquivo (PDF, imagem, etc.)
   - Clicar em "Adicionar Anexos" ou "Adicionar Comentário e Anexos"

3. **Verificar resultado esperado**
   - ✅ Mensagem de sucesso: "Anexos adicionados com sucesso" ou "Comentário e anexos adicionados com sucesso"
   - ✅ Página recarrega automaticamente
   - ✅ Na seção "Atividades", o novo comentário aparece
   - ✅ Abaixo do comentário, aparece seção "Anexos (X)" com o arquivo
   - ✅ Arquivo tem botão de download (ícone de seta para baixo)
   - ✅ Na seção "Anexos do Ticket" (acima), o arquivo NÃO aparece
   - ✅ Aparece aviso: "💡 Anexos de comentários aparecem inline nas Atividades abaixo"

### Resultado Esperado
```
┌─────────────────────────────────────┐
│ Anexos do Ticket (0)                │
│ 💡 Anexos de comentários aparecem   │
│    inline nas Atividades abaixo     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Atividades (1)                      │
│                                     │
│ 🔵 João Silva                       │
│    09/03/2026 às 14:30             │
│    Comentário de teste             │
│    ─────────────────────────────   │
│    📎 Anexos (1)                   │
│    ┌─────────────────────────┐    │
│    │ 📄 documento.pdf        │    │
│    │ 1.2 MB            [⬇️]  │    │
│    └─────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 🧪 Teste 2: Anexos do Ticket (Descrição Inicial)

### Objetivo
Verificar que anexos adicionados na descrição inicial do ticket aparecem na seção "Anexos do Ticket"

### Passos

1. **Criar novo ticket COM anexo**
   ```
   Portal Organização → Tickets → Novo Ticket
   ```
   - Preencher assunto e descrição
   - Na seção "Anexos", adicionar um arquivo
   - Clicar em "Criar Ticket"

2. **Abrir o ticket criado**

3. **Verificar resultado esperado**
   - ✅ Na seção "Anexos do Ticket", o arquivo aparece
   - ✅ Arquivo tem 3 botões: Eye (👁️), Download (⬇️), Delete (🗑️)
   - ✅ Na seção "Atividades", o arquivo NÃO aparece

### Resultado Esperado
```
┌─────────────────────────────────────┐
│ Anexos do Ticket (1)                │
│ ┌─────────────────────────────────┐ │
│ │ 📄 relatorio.pdf                │ │
│ │ 2.5 MB        [👁️] [⬇️] [🗑️]  │ │
│ └─────────────────────────────────┘ │
│ 💡 Anexos de comentários aparecem   │
│    inline nas Atividades abaixo     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Atividades (0)                      │
│ Nenhuma atividade ainda            │
└─────────────────────────────────────┘
```

---

## 🧪 Teste 3: Visualização de PDF Inline

### Objetivo
Verificar que PDFs abrem em visualização inline, não fazem download automático

### Passos

1. **Preparar ticket com anexo PDF**
   - Usar ticket do Teste 1 ou Teste 2 que tenha um PDF anexado

2. **Clicar no ícone Eye (👁️) do PDF**
   - Se PDF está em "Anexos do Ticket": clicar no ícone Eye
   - Se PDF está em comentário: clicar no nome do arquivo ou ícone Eye (se houver)

3. **Verificar resultado esperado**
   - ✅ Modal de visualização abre em tela cheia
   - ✅ PDF é exibido inline no navegador (não faz download)
   - ✅ É possível navegar pelas páginas do PDF
   - ✅ Header mostra:
     - Nome do arquivo
     - Tamanho do arquivo
     - Botão de Download (⬇️)
     - Botão de Fechar (✖️)
   - ✅ Ao clicar no botão Download, o arquivo é baixado
   - ✅ Ao clicar no botão Fechar ou fora do modal, a visualização fecha

### Resultado Esperado
```
┌─────────────────────────────────────────────────────────┐
│ 📄 documento.pdf | 1.2 MB          [⬇️] [✖️]           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │                                               │     │
│  │         [Conteúdo do PDF renderizado]         │     │
│  │                                               │     │
│  │  Lorem ipsum dolor sit amet, consectetur      │     │
│  │  adipiscing elit. Sed do eiusmod tempor...    │     │
│  │                                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Teste 4: Visualização de Outros Tipos de Arquivo

### Objetivo
Verificar que outros tipos de arquivo também abrem em visualização inline

### Passos

1. **Testar com IMAGEM (JPG, PNG, GIF)**
   - Adicionar imagem como anexo
   - Clicar no ícone Eye
   - ✅ Imagem é exibida inline
   - ✅ Controles de zoom aparecem (+ / -)
   - ✅ É possível aumentar/diminuir zoom

2. **Testar com VÍDEO (MP4, WEBM)**
   - Adicionar vídeo como anexo
   - Clicar no ícone Eye
   - ✅ Player de vídeo aparece
   - ✅ É possível reproduzir, pausar, ajustar volume
   - ✅ Controles de vídeo funcionam

3. **Testar com ÁUDIO (MP3, WAV)**
   - Adicionar áudio como anexo
   - Clicar no ícone Eye
   - ✅ Player de áudio aparece
   - ✅ É possível reproduzir, pausar, ajustar volume
   - ✅ Ícone de áudio é exibido

4. **Testar com TEXTO (TXT, JSON, MD)**
   - Adicionar arquivo de texto como anexo
   - Clicar no ícone Eye
   - ✅ Conteúdo do texto é exibido
   - ✅ Formatação é preservada

5. **Testar com ARQUIVO NÃO SUPORTADO (ZIP, EXE, etc.)**
   - Adicionar arquivo não suportado
   - Clicar no ícone Eye
   - ✅ Mensagem aparece: "Pré-visualização não disponível para este tipo de arquivo"
   - ✅ Botão de download é oferecido

---

## 🧪 Teste 5: Download de Arquivos

### Objetivo
Verificar que o botão de download funciona corretamente

### Passos

1. **Abrir visualização de um arquivo**
   - Clicar no ícone Eye de qualquer anexo

2. **Clicar no botão Download (⬇️) no header**

3. **Verificar resultado esperado**
   - ✅ Arquivo é baixado para a pasta de Downloads
   - ✅ Nome do arquivo é preservado
   - ✅ Tamanho do arquivo está correto
   - ✅ Arquivo pode ser aberto normalmente

---

## 🧪 Teste 6: Permissões e Segurança

### Objetivo
Verificar que apenas usuários autorizados podem visualizar anexos

### Passos

1. **Como usuário da organização**
   - ✅ Pode visualizar anexos de tickets da sua estrutura organizacional
   - ✅ Pode fazer download de anexos

2. **Como cliente**
   - ✅ Pode visualizar anexos dos seus próprios tickets
   - ✅ Pode fazer download de anexos
   - ❌ NÃO pode visualizar anexos de tickets de outros clientes

3. **Sem autenticação**
   - ❌ Não consegue acessar endpoint `/view` ou `/download`
   - ❌ Retorna erro 401 Unauthorized

---

## 📊 Checklist de Validação

### Anexos de Comentários
- [ ] Anexos aparecem inline abaixo do comentário
- [ ] Anexos NÃO aparecem na seção "Anexos do Ticket"
- [ ] Aviso é exibido na seção "Anexos do Ticket"
- [ ] Botão de download funciona

### Anexos do Ticket
- [ ] Anexos aparecem na seção "Anexos do Ticket"
- [ ] Anexos NÃO aparecem nas Atividades
- [ ] Botões Eye, Download e Delete funcionam

### Visualização de PDFs
- [ ] PDF abre em visualização inline
- [ ] NÃO faz download automático
- [ ] É possível navegar pelas páginas
- [ ] Botão de download funciona
- [ ] Botão de fechar funciona

### Outros Tipos de Arquivo
- [ ] Imagens exibem com zoom
- [ ] Vídeos reproduzem com controles
- [ ] Áudios reproduzem com controles
- [ ] Textos exibem conteúdo
- [ ] Arquivos não suportados mostram mensagem

### Performance
- [ ] Visualização abre rapidamente (< 2 segundos)
- [ ] Não há erros no console do navegador
- [ ] Não há erros no log do backend
- [ ] Cache funciona (segunda visualização é mais rápida)

### Segurança
- [ ] Apenas usuários autorizados podem visualizar
- [ ] Token JWT é validado
- [ ] Permissões estruturais são respeitadas

---

## 🐛 Problemas Conhecidos

### Nenhum problema conhecido no momento

Se encontrar algum problema durante os testes, documente aqui:

1. **Descrição do problema:**
2. **Passos para reproduzir:**
3. **Resultado esperado:**
4. **Resultado obtido:**
5. **Logs relevantes:**

---

## 📝 Notas de Teste

### Console do Navegador
Ao visualizar um arquivo, você deve ver no console:
```javascript
📄 Arquivo carregado: {
  filename: "documento.pdf",
  mimeType: "application/pdf",
  size: 1234567,
  blobUrl: "blob:http://localhost:5173/..."
}
```

### Logs do Backend
Ao visualizar um arquivo, você deve ver no log:
```
[INFO] Visualização solicitada - ticketId: xxx, attachmentId: yyy, userId: zzz
[INFO] Anexo encontrado - path: /uploads/..., mimeType: application/pdf
[INFO] Verificação de permissão - isOrgUser: true, isClientUser: false, isRequester: false
[INFO] Enviando arquivo para visualização - path: /uploads/..., mimeType: application/pdf
```

---

## ✅ Critérios de Aceitação

Para considerar os testes bem-sucedidos, TODOS os itens abaixo devem estar OK:

1. ✅ Anexos de comentários aparecem inline nas Atividades
2. ✅ Anexos do ticket aparecem na seção "Anexos do Ticket"
3. ✅ PDFs abrem em visualização inline (não fazem download)
4. ✅ Outros tipos de arquivo também visualizam corretamente
5. ✅ Botão de download funciona para todos os tipos
6. ✅ Permissões são respeitadas
7. ✅ Não há erros no console ou logs
8. ✅ Performance é aceitável (< 2 segundos)

---

**Testado por:** [Nome]  
**Data do teste:** [Data]  
**Resultado:** [ ] ✅ Aprovado | [ ] ❌ Reprovado  
**Observações:** [Comentários adicionais]
