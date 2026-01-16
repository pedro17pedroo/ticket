# Implementation Plan: Project Reports

## Overview

Implementação do sistema de Relatórios de Projetos, incluindo página de seleção, geração de PDF/Excel, e histórico de relatórios.

## Tasks

- [x] 1. Setup inicial e estrutura base
  - [x] 1.1 Criar tabela `project_reports` para histórico
    - Campos: id, organization_id, project_id, type, format, filename, file_path, file_size, options, generated_by, generated_at, expires_at
    - _Requirements: 10.1_
  - [x] 1.2 Adicionar submenu "Relatórios" no Sidebar dentro de Projetos
    - Adicionar item de menu com ícone FileBarChart
    - Rota: `/projects/reports`
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Criar rota e página base ProjectReports.jsx
    - Configurar rota no App.jsx
    - Criar estrutura básica da página
    - _Requirements: 2.1_

- [x] 2. Página de seleção de relatórios
  - [x] 2.1 Implementar grid de cards com tipos de relatórios
    - 7 tipos de relatórios com ícones e descrições
    - Cores distintas para cada tipo
    - _Requirements: 2.2_
  - [x] 2.2 Implementar seleção de projeto
    - Dropdown com lista de projetos
    - Filtros por estado, metodologia, período
    - _Requirements: 2.3, 2.4_
  - [x] 2.3 Implementar navegação para geração
    - Modal ou página de opções do relatório
    - Seleção de formato (PDF/Excel quando disponível)
    - _Requirements: 2.3_

- [x] 3. Backend - Endpoints de dados
  - [x] 3.1 Criar endpoint GET /api/projects/:id/reports/data/:type
    - Agregar dados do projeto conforme tipo de relatório
    - Incluir informações da organização para cabeçalho
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_
  - [x] 3.2 Implementar lógica de agregação por tipo de relatório
    - project_charter: projeto, stakeholders, fases
    - project_closure: projeto, tarefas concluídas, progresso
    - status_report: estado atual, tarefas por estado, atrasadas
    - schedule_report: fases, tarefas, dependências
    - task_report: todas as tarefas com filtros
    - stakeholder_report: stakeholders agrupados
    - executive_summary: KPIs, gráficos
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_
  - [x] 3.3 Write property test for report data completeness
    - **Property 1: Report Data Completeness**
    - **Validates: Requirements 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1**

- [x] 4. Backend - Geração de relatórios
  - [x] 4.1 Instalar e configurar PDFKit e ExcelJS
    - Adicionar dependências ao package.json
    - Criar utilitários de geração
    - _Requirements: 3.2, 4.2, 5.3_
  - [x] 4.2 Criar templates PDF para cada tipo de relatório
    - Template base com cabeçalho/rodapé
    - Estilos corporativos
    - _Requirements: 3.3, 3.4_
  - [x] 4.3 Implementar endpoint POST /api/projects/:id/reports/generate
    - Receber tipo, formato e opções
    - Gerar ficheiro e guardar
    - Retornar URL de download
    - _Requirements: 3.2, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3_
  - [x] 4.4 Write property test for multi-format export
    - **Property 2: Multi-Format Export Support**
    - **Validates: Requirements 5.3, 6.2, 7.3, 8.2**

- [x] 5. Implementar relatórios específicos
  - [x] 5.1 Termo de Abertura (project_charter)
    - Informações do projeto, objetivos, stakeholders, fases
    - Formato: PDF apenas
    - _Requirements: 3.1, 3.2_
  - [x] 5.2 Termo de Encerramento (project_closure)
    - Resumo de execução, entregas, lições aprendidas
    - Aviso se projeto não concluído
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.3 Ponto de Situação (status_report)
    - Estado atual, progresso, tarefas atrasadas destacadas
    - Seleção de período
    - Formatos: PDF, Excel
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 5.4 Cronograma (schedule_report)
    - Fases, tarefas, dependências, Gantt simplificado
    - Filtros por fase/período
    - Formatos: PDF, Excel
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 5.5 Lista de Tarefas (task_report)
    - Todas as tarefas com detalhes
    - Filtros múltiplos, totais e estatísticas
    - Formatos: PDF, Excel
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 5.6 Lista de Stakeholders (stakeholder_report)
    - Stakeholders agrupados por tipo/papel
    - Formatos: PDF, Excel
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 5.7 Resumo Executivo (executive_summary)
    - KPIs, gráficos, próximos marcos
    - Limitado a 1-2 páginas
    - Formato: PDF apenas
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Checkpoint - Testar geração de relatórios
  - Verificar que todos os tipos de relatórios são gerados corretamente
  - Testar formatos PDF e Excel
  - Validar conteúdo dos relatórios

- [x] 7. Frontend - Componente de geração
  - [x] 7.1 Criar ReportGenerator.jsx
    - Preview de opções do relatório
    - Seleção de formato
    - Botão de download
    - Loading state
    - _Requirements: 3.2, 5.3_
  - [x] 7.2 Implementar opções específicas por tipo
    - Período para status_report
    - Filtros para task_report
    - Agrupamento para stakeholder_report
    - _Requirements: 5.2, 6.3, 7.2, 8.3_
  - [x] 7.3 Write property test for filter application
    - **Property 3: Filter Application Correctness**
    - **Validates: Requirements 2.4, 6.3, 7.2**

- [x] 8. Histórico de relatórios
  - [x] 8.1 Criar endpoint GET /api/projects/reports/history
    - Listar relatórios gerados
    - Filtros por projeto, tipo, período
    - Paginação
    - _Requirements: 10.2_
  - [x] 8.2 Criar ReportHistory.jsx
    - Tabela com histórico
    - Filtros e paginação
    - Botão de re-download
    - _Requirements: 10.2, 10.3_
  - [x] 8.3 Implementar limpeza automática de relatórios antigos
    - Job para eliminar relatórios expirados
    - Período configurável (default: 90 dias)
    - _Requirements: 10.4_
  - [x] 8.4 Write property test for history persistence
    - **Property 4: Report History Persistence**
    - **Validates: Requirements 10.1, 10.2**

- [x] 9. Permissões e segurança
  - [x] 9.1 Implementar verificação de permissões no Sidebar
    - Mostrar submenu apenas com permissão de projetos
    - _Requirements: 1.3_
  - [x] 9.2 Adicionar middleware de permissões nos endpoints
    - Verificar acesso ao projeto
    - Verificar permissão de relatórios
    - _Requirements: 1.3_
  - [x] 9.3 Write property test for permission-based access
    - **Property 5: Permission-Based Access**
    - **Validates: Requirements 1.3**

- [x] 10. Testes adicionais e refinamentos
  - [x] 10.1 Write property test for task statistics accuracy
    - **Property 6: Task Statistics Accuracy**
    - **Validates: Requirements 7.4**
  - [x] 10.2 Write property test for stakeholder grouping
    - **Property 7: Stakeholder Grouping Consistency**
    - **Validates: Requirements 8.3**
  - [x] 10.3 Write property test for incomplete project warning
    - **Property 8: Incomplete Project Warning**
    - **Validates: Requirements 4.3**

- [x] 11. Final checkpoint
  - Verificar todos os tipos de relatórios
  - Testar histórico e re-download
  - Validar permissões
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
