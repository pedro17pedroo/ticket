# Análise do Problema de Base de Dados nos Testes

## 🔍 Problema Identificado

Quando os testes executam, as alterações da base de dados "desaparecem". Isto acontece porque:

### 1. Configuração de Teste Usa SQLite em Memória

**Arquivo:** `.env.test`
```bash
DB_DIALECT=sqlite
DB_STORAGE=:memory:
```

**O que isto significa:**
- Os testes NÃO usam a base de dados PostgreSQL de desenvolvimento
- Os testes criam uma base de dados temporária na memória RAM
- Quando os testes terminam, a memória é limpa e tudo desaparece
- A base de dados PostgreSQL de desenvolvimento permanece intacta

### 2. Testes Usam `sequelize.sync({ force: true })`

**O que isto faz:**
```javascript
await sequelize.sync({ force: true });
```

- **APAGA** todas as tabelas existentes
- **RECRIA** as tabelas baseado nos modelos Sequelize
- **NÃO EXECUTA** as migrações SQL (migrations)

**Problema:** Se os modelos Sequelize não estão sincronizados com as migrações, as tabelas criadas podem estar diferentes!

### 3. Problema de Conexão Fechada

```
Error: ConnectionManager.getConnection was called after the connection manager was closed!
```

**Causa:**
- O primeiro teste fecha a conexão do Sequelize
- Os testes seguintes tentam usar a conexão fechada
- Isto causa falhas em cascata

## ✅ Soluções Possíveis

### Solução 1: Usar PostgreSQL para Testes (Recomendado para Desenvolvimento)

**Vantagens:**
- Testa com a mesma base de dados que produção
- Garante compatibilidade total
- Permite testar funcionalidades específicas do PostgreSQL

**Desvantagens:**
- Mais lento que SQLite em memória
- Precisa de uma base de dados PostgreSQL separada para testes

**Como implementar:**

1. Criar uma base de dados PostgreSQL para testes:
```bash
PGPASSWORD="root" psql -h localhost -U postgres -c "CREATE DATABASE tatuticket_test;"
```

2. Atualizar `.env.test`:
```bash
# Banco de Dados de Teste (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tatuticket_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root
DB_DIALECT=postgres
```

3. Criar script de setup de testes que executa migrações:
```javascript
// tests/setup.js
import { sequelize } from '../src/config/database.js';
import { execSync } from 'child_process';

before(async () => {
  // Executar migrações
  execSync('npx sequelize-cli db:migrate', { 
    env: { ...process.env, NODE_ENV: 'test' } 
  });
});

after(async () => {
  // Limpar base de dados de teste
  await sequelize.drop();
  await sequelize.close();
});
```

### Solução 2: Manter SQLite mas Corrigir Gestão de Conexões

**Vantagens:**
- Testes muito rápidos
- Não precisa de PostgreSQL instalado
- Isolamento total entre testes

**Desvantagens:**
- Pode ter diferenças de comportamento entre SQLite e PostgreSQL
- Não testa funcionalidades específicas do PostgreSQL

**Como implementar:**

1. Criar um singleton para a conexão Sequelize:
```javascript
// tests/helpers/database.js
let sequelizeInstance = null;

export function getTestDatabase() {
  if (!sequelizeInstance) {
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
  }
  return sequelizeInstance;
}

export async function closeTestDatabase() {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
  }
}
```

2. Atualizar testes para usar o singleton:
```javascript
import { getTestDatabase } from '../helpers/database.js';

describe('My Test Suite', () => {
  let sequelize;

  before(async () => {
    sequelize = getTestDatabase();
    await sequelize.sync({ force: true });
  });

  // NÃO fechar a conexão aqui!
  // after(async () => {
  //   await sequelize.close(); // ❌ ISTO CAUSA O PROBLEMA
  // });
});
```

3. Fechar a conexão apenas no final de TODOS os testes:
```javascript
// tests/setup.js
import { closeTestDatabase } from './helpers/database.js';

after(async () => {
  await closeTestDatabase();
});
```

### Solução 3: Usar Base de Dados PostgreSQL de Desenvolvimento (NÃO RECOMENDADO)

**⚠️ ATENÇÃO:** Esta solução é perigosa!

**Vantagens:**
- Nenhuma (não há vantagens reais)

**Desvantagens:**
- ❌ Os testes podem apagar dados de desenvolvimento
- ❌ `sequelize.sync({ force: true })` apaga TODAS as tabelas
- ❌ Pode causar perda de dados importante
- ❌ Testes não são isolados

**NÃO FAZER ISTO!**

## 🎯 Recomendação

Para o seu caso, recomendo **Solução 1: Usar PostgreSQL para Testes**.

**Porquê:**
1. Garante que os testes usam a mesma base de dados que produção
2. Permite testar as migrações SQL reais
3. Evita surpresas quando o código vai para produção
4. Mantém os dados de desenvolvimento seguros

## 📝 Próximos Passos

Se quiser implementar a Solução 1, posso:

1. Criar a base de dados PostgreSQL de teste
2. Atualizar o arquivo `.env.test`
3. Criar scripts de setup/teardown para os testes
4. Atualizar os testes existentes para usar a nova configuração
5. Executar os testes novamente para verificar

**Quer que eu implemente esta solução?**

## 📚 Informação Adicional

### Por que a base de dados de desenvolvimento está intacta?

A base de dados PostgreSQL de desenvolvimento (`tatuticket`) **nunca foi afetada pelos testes** porque:

1. Os testes usam `.env.test` que aponta para SQLite em memória
2. A configuração de desenvolvimento usa `.env` que aponta para PostgreSQL
3. São ambientes completamente separados

### Como verificar a base de dados de desenvolvimento?

```bash
PGPASSWORD="root" psql -h localhost -U postgres -d tatuticket -c "\d directions"
PGPASSWORD="root" psql -h localhost -U postgres -d tatuticket -c "\d sections"
```

Você verá que as colunas `email` ainda existem! 🎉

### Como verificar se há dados na base de dados?

```bash
PGPASSWORD="root" psql -h localhost -U postgres -d tatuticket -c "SELECT id, name, email FROM directions LIMIT 5;"
PGPASSWORD="root" psql -h localhost -U postgres -d tatuticket -c "SELECT id, name, email FROM sections LIMIT 5;"
```

---

**Criado:** 16 de Janeiro de 2026
**Autor:** Kiro AI Agent
**Contexto:** Análise do problema de testes da feature organizational-email-routing
