# Requirements Document

## Introduction

Sistema de Relatórios de Projetos que permite gerar e exportar diversos tipos de documentos relacionados com a gestão de projetos, incluindo termos de abertura, termos de encerramento, pontos de situação, cronogramas e outros relatórios de acompanhamento.

## Glossary

- **Report_Generator**: Sistema responsável por gerar relatórios em diferentes formatos (PDF, Excel)
- **Project_Charter**: Termo de Abertura do Projeto - documento formal que autoriza o início do projeto
- **Project_Closure**: Termo de Encerramento do Projeto - documento que formaliza o encerramento
- **Status_Report**: Ponto de Situação - relatório periódico do estado do projeto
- **Schedule_Report**: Relatório de Cronograma - visão temporal das fases e tarefas
- **Stakeholder_Report**: Relatório de Stakeholders - lista de partes interessadas
- **Task_Report**: Relatório de Tarefas - listagem detalhada de tarefas

## Requirements

### Requirement 1: Acesso ao Menu de Relatórios

**User Story:** Como gestor de projeto, quero aceder a um submenu de relatórios dentro da secção de Projetos, para poder gerar diferentes tipos de documentos.

#### Acceptance Criteria

1. WHEN um utilizador acede à secção de Projetos THEN THE Sidebar SHALL exibir um submenu "Relatórios" dentro de Projetos
2. WHEN um utilizador clica em "Relatórios" THEN THE System SHALL navegar para a página de seleção de relatórios
3. THE Sidebar SHALL mostrar o submenu de Relatórios apenas para utilizadores com permissão de visualização de projetos

### Requirement 2: Página de Seleção de Relatórios

**User Story:** Como gestor de projeto, quero ver uma lista de todos os tipos de relatórios disponíveis, para poder escolher qual gerar.

#### Acceptance Criteria

1. WHEN um utilizador acede à página de relatórios THEN THE System SHALL exibir cards para cada tipo de relatório disponível
2. THE Report_Page SHALL mostrar os seguintes tipos de relatórios:
   - Termo de Abertura do Projeto
   - Termo de Encerramento do Projeto
   - Ponto de Situação
   - Cronograma (Gantt)
   - Lista de Tarefas
   - Lista de Stakeholders
   - Resumo Executivo
3. WHEN um utilizador seleciona um tipo de relatório THEN THE System SHALL permitir selecionar o projeto para o qual gerar o relatório
4. THE Report_Page SHALL permitir filtrar projetos por estado, metodologia ou período

### Requirement 3: Termo de Abertura do Projeto (Project Charter)

**User Story:** Como gestor de projeto, quero gerar um Termo de Abertura formal, para documentar a autorização e objetivos do projeto.

#### Acceptance Criteria

1. WHEN um utilizador solicita um Termo de Abertura THEN THE Report_Generator SHALL incluir:
   - Informações básicas do projeto (nome, código, datas)
   - Descrição e objetivos
   - Metodologia
   - Lista de stakeholders
   - Fases planeadas
   - Data de criação e responsável
2. THE Report_Generator SHALL exportar o Termo de Abertura em formato PDF
3. WHEN o relatório é gerado THEN THE System SHALL aplicar o template corporativo da organização
4. THE Report_Generator SHALL incluir cabeçalho com logo da organização (se configurado)

### Requirement 4: Termo de Encerramento do Projeto

**User Story:** Como gestor de projeto, quero gerar um Termo de Encerramento, para formalizar a conclusão do projeto.

#### Acceptance Criteria

1. WHEN um utilizador solicita um Termo de Encerramento THEN THE Report_Generator SHALL incluir:
   - Informações do projeto
   - Resumo de execução (tarefas concluídas vs planeadas)
   - Progresso final
   - Lista de entregas
   - Lições aprendidas (se registadas)
   - Data de encerramento
2. THE Report_Generator SHALL exportar o Termo de Encerramento em formato PDF
3. IF o projeto não estiver concluído THEN THE System SHALL exibir aviso mas permitir gerar o relatório

### Requirement 5: Ponto de Situação (Status Report)

**User Story:** Como gestor de projeto, quero gerar relatórios de ponto de situação, para comunicar o estado atual do projeto aos stakeholders.

#### Acceptance Criteria

1. WHEN um utilizador solicita um Ponto de Situação THEN THE Report_Generator SHALL incluir:
   - Estado atual do projeto
   - Progresso geral (percentagem)
   - Resumo de tarefas por estado
   - Tarefas em atraso (destacadas)
   - Próximas atividades
   - Riscos/Bloqueios (se existirem)
   - Período do relatório
2. THE Report_Generator SHALL permitir selecionar o período do relatório
3. THE Report_Generator SHALL exportar em formato PDF ou Excel
4. WHEN existem tarefas atrasadas THEN THE Report_Generator SHALL destacá-las visualmente

### Requirement 6: Relatório de Cronograma

**User Story:** Como gestor de projeto, quero exportar o cronograma do projeto, para partilhar a visão temporal com a equipa.

#### Acceptance Criteria

1. WHEN um utilizador solicita o Relatório de Cronograma THEN THE Report_Generator SHALL incluir:
   - Lista de fases com datas
   - Lista de tarefas por fase
   - Dependências entre tarefas
   - Progresso de cada item
   - Diagrama de Gantt simplificado
2. THE Report_Generator SHALL exportar em formato PDF ou Excel
3. THE Report_Generator SHALL permitir filtrar por fase ou período

### Requirement 7: Relatório de Tarefas

**User Story:** Como gestor de projeto, quero gerar uma lista detalhada de tarefas, para acompanhar o trabalho da equipa.

#### Acceptance Criteria

1. WHEN um utilizador solicita o Relatório de Tarefas THEN THE Report_Generator SHALL incluir:
   - Lista de todas as tarefas
   - Estado, prioridade e responsável de cada tarefa
   - Datas de início e fim
   - Horas estimadas vs realizadas
   - Fase associada
2. THE Report_Generator SHALL permitir filtrar por:
   - Estado (A Fazer, Em Progresso, Concluída, etc.)
   - Prioridade
   - Responsável
   - Fase
   - Período
3. THE Report_Generator SHALL exportar em formato PDF ou Excel
4. THE Report_Generator SHALL incluir totais e estatísticas no final

### Requirement 8: Relatório de Stakeholders

**User Story:** Como gestor de projeto, quero gerar uma lista de stakeholders, para documentar as partes interessadas.

#### Acceptance Criteria

1. WHEN um utilizador solicita o Relatório de Stakeholders THEN THE Report_Generator SHALL incluir:
   - Lista de todos os stakeholders
   - Tipo (interno/externo)
   - Papel no projeto
   - Informações de contacto
   - Notas (se existirem)
2. THE Report_Generator SHALL exportar em formato PDF ou Excel
3. THE Report_Generator SHALL agrupar stakeholders por tipo ou papel

### Requirement 9: Resumo Executivo

**User Story:** Como gestor de projeto, quero gerar um resumo executivo, para apresentar uma visão geral rápida do projeto.

#### Acceptance Criteria

1. WHEN um utilizador solicita um Resumo Executivo THEN THE Report_Generator SHALL incluir:
   - Informações básicas do projeto
   - Estado atual e progresso
   - KPIs principais (tarefas, prazos, recursos)
   - Gráficos de progresso
   - Próximos marcos
2. THE Report_Generator SHALL limitar o relatório a 1-2 páginas
3. THE Report_Generator SHALL exportar em formato PDF
4. THE Report_Generator SHALL usar visualizações gráficas quando apropriado

### Requirement 10: Histórico de Relatórios

**User Story:** Como gestor de projeto, quero ver o histórico de relatórios gerados, para aceder a versões anteriores.

#### Acceptance Criteria

1. THE System SHALL manter um registo dos relatórios gerados
2. WHEN um utilizador acede ao histórico THEN THE System SHALL mostrar:
   - Tipo de relatório
   - Projeto
   - Data de geração
   - Utilizador que gerou
3. THE System SHALL permitir descarregar novamente relatórios do histórico
4. THE System SHALL manter o histórico por um período configurável (default: 90 dias)
