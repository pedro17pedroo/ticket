# 🤝 Guia de Contribuição - TatuTicket

Obrigado por considerar contribuir para o TatuTicket! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Commits](#commits)
6. [Pull Requests](#pull-requests)
7. [Testes](#testes)

## 📜 Código de Conduta

Este projeto adere a um Código de Conduta. Ao participar, espera-se que você mantenha este código.

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🎯 Como Posso Contribuir?

### Reportar Bugs

Antes de criar um bug report:
- Verifique se o bug já foi reportado
- Colete informações sobre o bug
- Reproduza o bug de forma consistente

**Template de Bug Report:**
```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '....'
3. Role até '....'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [e.g. Ubuntu 22.04]
 - Browser: [e.g. Chrome 120]
 - Versão: [e.g. 1.0.0]
```

### Sugerir Melhorias

**Template de Feature Request:**
```markdown
**Problema que Resolve**
Descrição clara do problema.

**Solução Proposta**
Descrição da solução desejada.

**Alternativas Consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Qualquer outro contexto ou screenshots.
```

### Contribuir com Código

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Faça suas alterações
4. Commit (`git commit -m 'Add some AmazingFeature'`)
5. Push (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 🔧 Processo de Desenvolvimento

### Setup do Ambiente

```bash
# Clone seu fork
git clone https://github.com/your-username/tatuticket.git
cd tatuticket

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-org/tatuticket.git

# Instale dependências
cd backend && npm install
cd ../portalOrganizaçãoTenant && npm install
cd ../portalClientEmpresa && npm install
```

### Branches

- `main` - Produção estável
- `develop` - Desenvolvimento ativo
- `feature/*` - Novas funcionalidades
- `bugfix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes para produção
- `release/*` - Preparação de releases

### Workflow

1. Sempre crie branches a partir de `develop`
2. Mantenha sua branch atualizada com `develop`
3. Faça commits pequenos e focados
4. Escreva testes para novas funcionalidades
5. Atualize a documentação quando necessário

## 📝 Padrões de Código

### Backend (Node.js)

```javascript
// ✅ BOM
const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
};

// ❌ RUIM
const getUser = (id) => {
  return User.findByPk(id);
};
```

**Regras:**
- Use `const` e `let`, nunca `var`
- Use arrow functions quando apropriado
- Use async/await ao invés de callbacks
- Sempre trate erros
- Use destructuring quando possível
- Nomes descritivos para variáveis e funções

### Frontend (React)

```jsx
// ✅ BOM
const UserCard = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit(user.id);
  }, [user.id, onEdit]);

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};

// ❌ RUIM
function UserCard(props) {
  return (
    <div>
      <h3>{props.user.name}</h3>
      <button onClick={() => props.onEdit(props.user.id)}>Edit</button>
    </div>
  );
}
```

**Regras:**
- Use componentes funcionais com hooks
- Destructure props
- Use `useCallback` e `useMemo` quando apropriado
- Mantenha componentes pequenos e focados
- Use PropTypes ou TypeScript
- Siga convenções de nomenclatura (PascalCase para componentes)

### CSS/Tailwind

```jsx
// ✅ BOM
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
  Click me
</button>

// ❌ RUIM
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>
```

**Regras:**
- Use Tailwind CSS classes
- Evite inline styles
- Use classes utilitárias
- Mantenha consistência de cores e espaçamentos

## 💬 Commits

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit.

**Formato:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Manutenção, dependências, etc
- `perf`: Melhoria de performance
- `ci`: Mudanças em CI/CD

**Exemplos:**
```bash
feat(tickets): add priority filter to ticket list

fix(auth): resolve JWT token expiration issue

docs(readme): update installation instructions

refactor(catalog): improve category hierarchy logic

test(rbac): add integration tests for permissions

chore(deps): update dependencies to latest versions
```

## 🔀 Pull Requests

### Checklist

Antes de submeter um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Todos os testes passam
- [ ] Documentação foi atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com `develop`
- [ ] Não há conflitos
- [ ] Descrição do PR está completa

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
Adicione screenshots aqui.

## Checklist
- [ ] Código segue padrões
- [ ] Testes adicionados
- [ ] Documentação atualizada
- [ ] Sem conflitos
```

## 🧪 Testes

### Backend

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Cobertura
npm run test:coverage
```

**Exemplo de Teste:**
```javascript
describe('UserController', () => {
  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      expect(response.status).to.equal(201);
      expect(response.body.user.email).to.equal(userData.email);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.errors).to.exist;
    });
  });
});
```

### Frontend

```bash
# Linter
npm run lint

# Build test
npm run build
```

### Cobertura Mínima

- Backend: 80%
- Funções críticas: 90%

## 📚 Documentação

### Comentários no Código

```javascript
/**
 * Cria um novo ticket no sistema
 * @param {Object} ticketData - Dados do ticket
 * @param {string} ticketData.title - Título do ticket
 * @param {string} ticketData.description - Descrição
 * @param {number} ticketData.userId - ID do usuário
 * @returns {Promise<Ticket>} Ticket criado
 * @throws {ValidationError} Se dados inválidos
 */
const createTicket = async (ticketData) => {
  // Implementação
};
```

### README

Atualize README.md quando:
- Adicionar nova funcionalidade importante
- Mudar processo de instalação
- Adicionar nova dependência
- Mudar configuração

## 🎨 Style Guide

### Nomenclatura

**Variáveis e Funções:**
```javascript
// camelCase
const userName = 'John';
const getUserById = () => {};
```

**Classes e Componentes:**
```javascript
// PascalCase
class UserService {}
const UserCard = () => {};
```

**Constantes:**
```javascript
// UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

**Arquivos:**
```
// camelCase para JS/TS
userController.js
authService.js

// PascalCase para componentes React
UserCard.jsx
TicketList.jsx

// kebab-case para CSS/config
user-card.css
docker-compose.yml
```

## 🐛 Debugging

### Backend

```javascript
// Use logger ao invés de console.log
import logger from './config/logger.js';

logger.info('User created', { userId: user.id });
logger.error('Error creating user', { error: error.message });
logger.debug('Debug info', { data });
```

### Frontend

```javascript
// Use console apropriado
console.log('Info'); // Desenvolvimento
console.error('Error'); // Erros
console.warn('Warning'); // Avisos
console.debug('Debug'); // Debug detalhado
```

## 📞 Dúvidas?

- Abra uma [Discussion](https://github.com/your-org/tatuticket/discussions)
- Entre em contato: dev@tatuticket.com
- Leia a [Documentação](https://docs.tatuticket.com)

---

**Obrigado por contribuir! 🎉**
