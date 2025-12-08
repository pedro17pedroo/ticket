# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- CI/CD pipeline com GitHub Actions
- Testes de integração para catálogo de serviços
- Testes de integração para sistema RBAC
- Documentação completa de deployment (DEPLOYMENT.md)
- Guia de contribuição (CONTRIBUTING.md)
- Script de setup automatizado (setup.sh)
- README principal do projeto

### Changed
- Melhorias na documentação geral
- Atualização de dependências

### Fixed
- Correções menores em testes existentes

## [1.0.0] - 2024-12-06

### Added
- Sistema completo de gestão de tickets
- Portal Organização (90% completo)
- Portal Cliente (80% completo)
- Sistema RBAC com 8 roles e 61+ permissões
- Catálogo de serviços V2 enterprise
  - Hierarquia ilimitada de categorias
  - 4 tipos de item (Incident, Service, Support, Request)
  - Roteamento organizacional (Direction → Department → Section)
  - Auto-prioridade por tipo
  - Campos customizados dinâmicos
- Base de conhecimento
- Sistema de SLAs
- Bolsa de horas
- Inventário de ativos
- Notificações em tempo real (Socket.io)
- Sistema de comentários
- Upload de anexos
- Multi-idioma (PT/EN)
- Tema escuro/claro
- Docker Compose para deployment
- Documentação completa
  - PRD.md
  - backend/README.md
  - backend/RBAC-STATUS.md
  - backend/CATALOG-SYSTEM-GUIDE.md
  - portalOrganizaçãoTenant/README.md
  - portalClientEmpresa/README.md

### Backend
- Arquitetura modular com 35+ módulos
- Clean Architecture
- PostgreSQL para dados principais
- MongoDB para logs e auditoria
- Redis para cache e sessões
- JWT + Passport.js para autenticação
- Sequelize ORM
- Winston para logs
- Swagger para documentação API
- 150+ endpoints REST

### Frontend
- React 18 com hooks
- Vite para build
- Tailwind CSS para estilização
- Zustand para gestão de estado
- React Router v6
- React Hook Form
- Axios para HTTP
- Lucide React para ícones
- Recharts para gráficos
- Ant Design (Portal Organização)
- React Quill para editor rico

### Security
- RBAC granular
- Rate limiting
- Helmet para headers de segurança
- CORS configurável
- Bcrypt para hashing de senhas
- JWT com expiração
- Validação de entrada (Joi)
- Isolamento multi-tenant

### Tests
- Testes unitários (Mocha/Chai)
- Testes de integração (Supertest)
- Testes E2E
- ~70% cobertura de código
- Testes de segurança multi-tenant

## [0.9.0] - 2024-11-15

### Added
- Sistema de catálogo de serviços V2
- Hierarquia de categorias
- Tipos de item
- Roteamento organizacional
- Migration 20251115-enhance-catalog-system

### Changed
- Melhorias no modelo de catálogo
- Atualização da documentação do catálogo

## [0.8.0] - 2024-11-05

### Added
- Sistema RBAC completo
- 8 roles predefinidas
- 61 permissões granulares
- Sistema de fallback
- Migration para tabelas RBAC

### Changed
- Refatoração do sistema de autenticação
- Melhorias no middleware de permissões

### Fixed
- Erro 500 em rotas com RBAC
- Problemas de isolamento multi-tenant

## [0.7.0] - 2024-10-25

### Added
- Base de conhecimento
- Sistema de tags
- Templates de resposta
- Time tracking
- Watchers em tickets

### Changed
- Melhorias na UI do portal cliente
- Otimizações de performance

## [0.6.0] - 2024-10-15

### Added
- Sistema de SLAs
- Bolsa de horas
- Inventário de ativos
- Gestão de licenças

### Changed
- Melhorias no dashboard
- Novos gráficos e métricas

## [0.5.0] - 2024-10-01

### Added
- Portal Cliente inicial
- Sistema de comentários
- Upload de anexos
- Notificações em tempo real

### Changed
- Refatoração do sistema de tickets
- Melhorias na UI

## [0.4.0] - 2024-09-15

### Added
- Portal Organização inicial
- Dashboard com métricas
- Gestão de usuários
- Gestão de clientes B2B

### Changed
- Melhorias na arquitetura do backend
- Otimizações de queries

## [0.3.0] - 2024-09-01

### Added
- Sistema de tickets básico
- Autenticação JWT
- Estrutura organizacional (Directions, Departments, Sections)
- Categorias e prioridades

### Changed
- Migração para ES Modules
- Atualização de dependências

## [0.2.0] - 2024-08-15

### Added
- Configuração inicial do backend
- Modelos Sequelize
- Rotas básicas
- Middleware de autenticação

### Changed
- Estrutura de pastas
- Configuração do banco de dados

## [0.1.0] - 2024-08-01

### Added
- Estrutura inicial do projeto
- Configuração do monorepo
- Docker Compose
- Documentação inicial (PRD.md)

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de segurança

## Links

- [Unreleased]: https://github.com/your-org/tatuticket/compare/v1.0.0...HEAD
- [1.0.0]: https://github.com/your-org/tatuticket/releases/tag/v1.0.0
