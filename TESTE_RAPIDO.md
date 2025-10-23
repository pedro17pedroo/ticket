# 🧪 Guia de Teste Rápido - TatuTicket

## ⚡ Teste em 10 Minutos

### 1. Iniciar Sistema (2 min)

```bash
cd /Users/pedrodivino/Dev/ticket

# Iniciar containers
docker-compose up -d

# Aguardar containers iniciarem (30s)
sleep 30

# Criar dados iniciais
docker-compose exec backend node src/seeds/initialSeed.js

# Verificar status
docker-compose ps
```

Resultado esperado: 6 containers "Up"
- ✅ backend
- ✅ postgres
- ✅ mongodb
- ✅ redis
- ✅ portal-org
- ✅ portal-client

---

### 2. Testar Backend (1 min)

```bash
# Health check
curl http://localhost:3000/api/health

# Login Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com","password":"Admin@123"}'

# Deve retornar: token JWT + dados do user
```

---

### 3. Portal Organização (3 min)

**URL:** http://localhost:8080

#### 3.1 Login
```
Email: admin@empresademo.com
Senha: Admin@123
```

#### 3.2 Dashboard
- ✅ Ver estatísticas
- ✅ Gráficos de tickets
- ✅ Tickets recentes

#### 3.3 Criar Ticket
1. Menu → Tickets → "Novo Ticket"
2. Preencher:
   - Assunto: "Teste de ticket"
   - Descrição: "Testando funcionalidade"
   - Prioridade: "Alta"
3. Criar
4. ✅ Verificar ticket na lista

#### 3.4 Adicionar Comentário
1. Clicar no ticket criado
2. Adicionar comentário: "Teste de resposta"
3. Marcar como "Nota interna"
4. ✅ Verificar comentário aparece

#### 3.5 Categorias (NOVO)
1. Menu → Categorias
2. "Nova Categoria"
3. Preencher:
   - Nome: "Suporte"
   - Ícone: 🔧
   - Cor: Azul
4. ✅ Criar e verificar grid

#### 3.6 Base de Conhecimento (NOVO)
1. Menu → Base de Conhecimento
2. "Novo Artigo"
3. Preencher:
   - Título: "Como criar ticket"
   - Conteúdo: "Guia passo a passo..."
   - Publicar: ✓
4. ✅ Criar e verificar lista

#### 3.7 SLAs (NOVO)
1. Menu → SLAs
2. "Novo SLA"
3. Preencher:
   - Nome: "SLA Alta Prioridade"
   - Prioridade: Alta
   - Resposta: 60 min
   - Resolução: 480 min
4. ✅ Criar e verificar card

---

### 4. Portal Cliente (2 min)

**URL:** http://localhost:8081

#### 4.1 Login
```
Email: cliente@empresademo.com
Senha: Cliente@123
```

#### 4.2 Dashboard
- ✅ Ver estatísticas pessoais
- ✅ Tickets recentes
- ✅ Ações rápidas

#### 4.3 Criar Ticket
1. "Novo Ticket"
2. Preencher:
   - Assunto: "Dúvida sobre sistema"
   - Descrição: "Como exportar relatórios?"
   - Prioridade: Média
3. ✅ Criar e verificar

#### 4.4 Adicionar Resposta
1. Clicar no ticket
2. Adicionar resposta: "Informação adicional..."
3. ✅ Enviar e verificar

---

### 5. Temas e Idiomas (1 min)

#### Portal Organização
- ✅ Clicar ícone lua/sol → Alternar tema
- ✅ Clicar bandeira → Alternar PT/EN

#### Portal Cliente
- ✅ Clicar ícone lua/sol → Alternar tema

---

### 6. Responsividade (1 min)

1. Redimensionar janela
2. ✅ Mobile (< 768px) - Menu hambúrguer
3. ✅ Tablet (768-1024px) - Layout adaptado
4. ✅ Desktop (> 1024px) - Layout completo

---

## 🔍 Verificações Técnicas

### Backend

```bash
# Ver logs
docker-compose logs -f backend

# Logs devem mostrar:
# - Server running on port 3000
# - Database connected
# - Redis connected
```

### Base de Dados

```bash
# PostgreSQL - Verificar tabelas
docker-compose exec postgres psql -U postgres -d tatuticket -c "\dt"

# MongoDB - Verificar logs
docker-compose exec mongodb mongosh tatuticket_logs --eval "db.audit_logs.countDocuments()"

# Redis - Verificar conexão
docker-compose exec redis redis-cli ping
```

### Auditoria

```bash
# Ver logs de auditoria
docker-compose exec mongodb mongosh tatuticket_logs --eval "db.audit_logs.find().sort({timestamp: -1}).limit(5).pretty()"

# Deve mostrar ações recentes (CREATE, UPDATE, etc.)
```

---

## 📊 Checklist de Funcionalidades

### Backend APIs
- [ ] Health check responde
- [ ] Login retorna token
- [ ] CRUD de tickets funciona
- [ ] CRUD de categorias funciona
- [ ] CRUD de knowledge funciona
- [ ] CRUD de SLAs funciona
- [ ] Comentários funcionam
- [ ] Auditoria registra ações

### Portal Organização
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar ticket funciona
- [ ] Listar tickets funciona
- [ ] Filtros funcionam
- [ ] Comentários funcionam
- [ ] Categorias CRUD funciona
- [ ] Knowledge CRUD funciona
- [ ] SLAs CRUD funciona
- [ ] Tema escuro funciona
- [ ] Multi-idioma funciona
- [ ] Responsivo funciona

### Portal Cliente
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar ticket funciona
- [ ] Ver meus tickets funciona
- [ ] Adicionar resposta funciona
- [ ] Pesquisa funciona
- [ ] Filtros funcionam
- [ ] Tema escuro funciona
- [ ] Responsivo funciona

---

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs de erro
docker-compose logs

# Reiniciar
docker-compose down
docker-compose up -d
```

### Backend não conecta ao DB

```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DB
```

### Frontend não carrega

```bash
# Verificar nginx
docker-compose exec portal-org nginx -t

# Rebuild
docker-compose build portal-org
docker-compose up -d portal-org
```

### Seed não funciona

```bash
# Executar manualmente
docker-compose exec backend node src/seeds/initialSeed.js

# Ver logs
docker-compose logs backend
```

---

## 📈 Testes de Performance

### Tempo de Resposta

```bash
# Testar APIs
time curl http://localhost:3000/api/health
# Esperado: < 100ms

time curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN"
# Esperado: < 500ms
```

### Load Test Simples

```bash
# Instalar Apache Bench
brew install httpd  # macOS

# Testar
ab -n 100 -c 10 http://localhost:3000/api/health

# Resultados esperados:
# - 100% successful requests
# - Tempo médio < 200ms
```

---

## ✅ Critérios de Aceitação

### Mínimo para PASS

- ✅ Todos os 6 containers UP
- ✅ Backend responde ao health check
- ✅ Login funciona em ambos portais
- ✅ Criar ticket funciona
- ✅ Dashboard carrega com dados
- ✅ Pelo menos 1 CRUD completo funciona

### Ideal para PASS

- ✅ Todos itens do mínimo
- ✅ Todos os CRUDs funcionam
- ✅ Temas funcionam
- ✅ Comentários funcionam
- ✅ Auditoria registra
- ✅ Responsivo funciona

---

## 🎯 Próximos Passos Após Teste

Se todos os testes passarem:

1. ✅ **Deploy Staging** - Ambiente de testes
2. ✅ **Testes UAT** - User Acceptance Testing
3. ✅ **Deploy Produção** - Go live

Se houver falhas:

1. 🐛 **Debug** - Verificar logs
2. 🔧 **Fix** - Corrigir problemas
3. 🧪 **Retest** - Executar testes novamente

---

## 📞 Suporte

Para problemas:

1. Ver logs: `docker-compose logs -f`
2. Consultar [COMANDOS.md](COMANDOS.md)
3. Verificar [DEPLOY.md](DEPLOY.md)

---

**Tempo total estimado: 10 minutos**

**Boa sorte com os testes! 🚀**
