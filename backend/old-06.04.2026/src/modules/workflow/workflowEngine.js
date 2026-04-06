import { Op } from 'sequelize';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import { Ticket, User, Comment, Department } from '../models/index.js';
import emailProcessor from '../../services/emailProcessor.js';
import logger from '../../config/logger.js';

class WorkflowEngine {
  constructor() {
    this.runningExecutions = new Map();
    this.actionHandlers = {
      'status': this.actionChangeStatus.bind(this),
      'priority': this.actionChangePriority.bind(this),
      'assign': this.actionAssignUser.bind(this),
      'assign_to_team': this.actionAssignToTeam.bind(this),
      'department': this.actionChangeDepartment.bind(this),
      'add_comment': this.actionAddComment.bind(this),
      'add_tag': this.actionAddTag.bind(this),
      'send_email': this.actionSendEmail.bind(this),
      'webhook': this.actionWebhook.bind(this),
      'create_task': this.actionCreateTask.bind(this),
      'wait': this.actionWait.bind(this)
    };
  }

  async execute(workflow, execution) {
    try {
      // Marcar como executando
      await execution.update({
        status: 'running',
        startedAt: new Date()
      });

      this.runningExecutions.set(execution.id, true);

      // Carregar objeto alvo se existir
      const target = await this.loadTarget(execution.targetType, execution.targetId);
      
      // Configurar contexto de execução
      const context = {
        workflow,
        execution,
        target,
        variables: { ...workflow.variables, ...execution.variables },
        results: {}
      };

      // Executar steps
      const result = await this.executeSteps(workflow.steps, context);

      // Marcar como completo
      await execution.update({
        status: 'completed',
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
        result: result.results,
        steps: result.stepHistory
      });

      // Atualizar estatísticas do workflow
      await workflow.update({
        executionCount: workflow.executionCount + 1,
        lastExecutedAt: new Date()
      });

      this.runningExecutions.delete(execution.id);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao executar workflow ${workflow.id}:`, error);
      
      // Marcar como falha
      await execution.update({
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
        error: error.message,
        errorDetails: {
          stack: error.stack,
          data: error.data
        }
      });

      // Atualizar contador de erros do workflow
      await workflow.update({
        errorCount: workflow.errorCount + 1,
        lastError: error.message
      });

      this.runningExecutions.delete(execution.id);
      
      throw error;
    }
  }

  async executeTest(workflow, execution) {
    // Execução de teste - não faz alterações reais
    const testMode = true;
    
    try {
      await execution.update({
        status: 'running',
        startedAt: new Date()
      });

      const target = await this.loadTarget(execution.targetType, execution.targetId);
      
      const context = {
        workflow,
        execution,
        target,
        variables: { ...workflow.variables, ...execution.variables },
        results: {},
        testMode
      };

      const result = await this.executeSteps(workflow.steps, context);

      await execution.update({
        status: 'completed',
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
        result: result.results,
        steps: result.stepHistory
      });

      return {
        status: 'completed',
        steps: result.stepHistory,
        result: result.results,
        duration: execution.duration
      };
    } catch (error) {
      await execution.update({
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
        error: error.message
      });

      return {
        status: 'failed',
        error: error.message,
        duration: execution.duration
      };
    }
  }

  async executeSteps(steps, context) {
    const stepHistory = [];
    let currentStepId = steps[0]?.id;

    while (currentStepId) {
      const step = steps.find(s => s.id === currentStepId);
      
      if (!step) {
        throw new Error(`Step não encontrado: ${currentStepId}`);
      }

      // Verificar se a execução foi cancelada
      if (context.execution) {
        const exec = await WorkflowExecution.findByPk(context.execution.id);
        if (exec.status === 'cancelled') {
          throw new Error('Execução cancelada pelo usuário');
        }
      }

      const stepStart = Date.now();
      const stepResult = {
        stepId: step.id,
        stepName: step.name,
        startedAt: new Date(),
        status: 'running'
      };

      try {
        // Executar step baseado no tipo
        let nextStepId = null;
        let result = null;

        switch (step.type) {
          case 'condition':
            result = await this.executeCondition(step, context);
            nextStepId = result ? step.onTrue : step.onFalse;
            break;

          case 'action':
            result = await this.executeAction(step, context);
            nextStepId = step.next;
            break;

          case 'wait':
            result = await this.executeWait(step, context);
            nextStepId = step.next;
            break;

          case 'approval':
            result = await this.executeApproval(step, context);
            nextStepId = step.next;
            break;

          default:
            throw new Error(`Tipo de step desconhecido: ${step.type}`);
        }

        stepResult.status = 'completed';
        stepResult.result = result;
        stepResult.completedAt = new Date();
        stepResult.duration = Date.now() - stepStart;

        // Salvar resultado no contexto
        context.results[step.id] = result;

        // Próximo step
        currentStepId = nextStepId;
      } catch (error) {
        stepResult.status = 'failed';
        stepResult.error = error.message;
        stepResult.completedAt = new Date();
        stepResult.duration = Date.now() - stepStart;
        
        stepHistory.push(stepResult);
        throw error;
      }

      stepHistory.push(stepResult);

      // Atualizar execução com step atual (se não for modo teste)
      if (!context.testMode && context.execution) {
        await context.execution.update({
          currentStep: currentStepId,
          steps: stepHistory
        });
      }
    }

    return {
      stepHistory,
      results: context.results
    };
  }

  async executeCondition(step, context) {
    const { condition } = step;
    
    if (!condition) {
      throw new Error('Condição não definida');
    }

    const value = this.getValueFromPath(context, condition.field);
    const compareValue = condition.value;

    switch (condition.operator) {
      case '=':
      case '==':
        return value == compareValue;
      case '!=':
        return value != compareValue;
      case '>':
        return value > compareValue;
      case '>=':
        return value >= compareValue;
      case '<':
        return value < compareValue;
      case '<=':
        return value <= compareValue;
      case 'contains':
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
      case 'not_contains':
        return !String(value).toLowerCase().includes(String(compareValue).toLowerCase());
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(value);
      case 'empty':
        return !value || value === '' || (Array.isArray(value) && value.length === 0);
      case 'not_empty':
        return value && value !== '' && !(Array.isArray(value) && value.length === 0);
      default:
        throw new Error(`Operador desconhecido: ${condition.operator}`);
    }
  }

  async executeAction(step, context) {
    const { action } = step;
    
    if (!action) {
      throw new Error('Ação não definida');
    }

    const handler = this.actionHandlers[action.type];
    
    if (!handler) {
      throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }

    return await handler(action, context);
  }

  async executeWait(step, context) {
    const { wait } = step;
    
    if (!wait) {
      throw new Error('Tempo de espera não definido');
    }

    if (context.testMode) {
      return { waited: wait.duration, unit: wait.unit };
    }

    const milliseconds = this.getMilliseconds(wait.duration, wait.unit);
    await new Promise(resolve => setTimeout(resolve, milliseconds));
    
    return { waited: wait.duration, unit: wait.unit };
  }

  async executeApproval(step, context) {
    // Por enquanto, aprovação automática em modo teste
    if (context.testMode) {
      return { approved: true, approvedBy: 'auto' };
    }

    // TODO: Implementar sistema de aprovação real
    throw new Error('Sistema de aprovação não implementado');
  }

  // ===== ACTION HANDLERS =====

  async actionChangeStatus(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      await context.target.update({ status: action.value });
    }

    return { status: action.value };
  }

  async actionChangePriority(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      await context.target.update({ priority: action.value });
    }

    return { priority: action.value };
  }

  async actionAssignUser(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      await context.target.update({ assigneeId: action.value });
    }

    return { assigneeId: action.value };
  }

  async actionAssignToTeam(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      // Buscar agente disponível no departamento
      const agent = await User.findOne({
        where: {
          departmentId: action.value,
          role: ['agente', 'tecnico'],
          active: true
        },
        order: sequelize.random()
      });

      if (agent) {
        await context.target.update({ 
          assigneeId: agent.id,
          departmentId: action.value 
        });
        return { assigneeId: agent.id, departmentId: action.value };
      }

      await context.target.update({ departmentId: action.value });
    }

    return { departmentId: action.value };
  }

  async actionChangeDepartment(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      await context.target.update({ departmentId: action.value });
    }

    return { departmentId: action.value };
  }

  async actionAddComment(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      const comment = await Comment.create({
        content: action.value,
        ticketId: context.target.id,
        userId: context.execution.executedById || 1, // Sistema
        isPublic: action.isPublic !== false,
        organizationId: context.target.organizationId
      });

      return { commentId: comment.id };
    }

    return { comment: action.value };
  }

  async actionAddTag(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    const currentTags = context.target.tags || [];
    const newTags = [...new Set([...currentTags, action.value])];

    if (!context.testMode) {
      await context.target.update({ tags: newTags });
    }

    return { tags: newTags };
  }

  async actionSendEmail(action, context) {
    if (!context.target || context.target.constructor.name !== 'Ticket') {
      throw new Error('Ação requer um ticket como alvo');
    }

    if (!context.testMode) {
      // TODO: Implementar envio de e-mail usando template
      logger.info(`E-mail enviado: Template ${action.template}`);
    }

    return { emailSent: true, template: action.template };
  }

  async actionWebhook(action, context) {
    if (!context.testMode) {
      try {
        const response = await fetch(action.url, {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(action.headers || {})
          },
          body: JSON.stringify({
            workflow: context.workflow.name,
            execution: context.execution.id,
            target: context.target ? {
              type: context.execution.targetType,
              id: context.execution.targetId
            } : null,
            data: action.data || context.variables
          })
        });

        return { 
          webhookSent: true, 
          status: response.status,
          response: await response.text()
        };
      } catch (error) {
        logger.error('Erro ao enviar webhook:', error);
        throw error;
      }
    }

    return { webhookSent: false, testMode: true };
  }

  async actionCreateTask(action, context) {
    if (!context.testMode) {
      const task = await Ticket.create({
        subject: action.title,
        description: action.description || 'Tarefa criada automaticamente',
        status: 'novo',
        priority: action.priority || 'media',
        type: 'tarefa',
        requesterId: action.assignTo || context.execution.executedById,
        assigneeId: action.assignTo,
        organizationId: context.workflow.organizationId,
        parentId: context.target?.id
      });

      return { taskId: task.id, ticketNumber: task.ticketNumber };
    }

    return { task: action.title };
  }

  async actionWait(action, context) {
    if (!context.testMode) {
      const milliseconds = this.getMilliseconds(action.duration, action.unit);
      await new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    return { waited: action.duration, unit: action.unit };
  }

  // ===== HELPER METHODS =====

  async loadTarget(type, id) {
    if (!type || !id) return null;

    switch (type) {
      case 'ticket':
        return await Ticket.findByPk(id, {
          include: [
            { model: User, as: 'requester' },
            { model: User, as: 'assignee' },
            { model: Department, as: 'department' }
          ]
        });
      
      case 'user':
        return await User.findByPk(id);
      
      case 'department':
        return await Department.findByPk(id);
      
      default:
        return null;
    }
  }

  getValueFromPath(context, path) {
    const parts = path.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  getMilliseconds(duration, unit) {
    const multipliers = {
      'seconds': 1000,
      'minutes': 60 * 1000,
      'hours': 60 * 60 * 1000,
      'days': 24 * 60 * 60 * 1000
    };

    return duration * (multipliers[unit] || 1000);
  }

  // ===== EVENT TRIGGERS =====

  async triggerWorkflows(eventType, data) {
    try {
      // Buscar workflows ativos para este evento
      const workflows = await Workflow.findAll({
        where: {
          isActive: true,
          type: eventType,
          organizationId: data.organizationId
        },
        order: [['priority', 'ASC']]
      });

      for (const workflow of workflows) {
        try {
          // Verificar condições do trigger
          if (!this.checkTriggerConditions(workflow.trigger, data)) {
            continue;
          }

          // Verificar limite de execuções
          if (workflow.maxExecutions) {
            const executionCount = await WorkflowExecution.count({
              where: {
                workflowId: workflow.id,
                status: 'completed'
              }
            });

            if (executionCount >= workflow.maxExecutions) {
              logger.info(`Workflow ${workflow.id} atingiu limite de execuções`);
              continue;
            }
          }

          // Verificar cooldown
          if (workflow.cooldownMinutes > 0 && data.targetId) {
            const recentExecution = await WorkflowExecution.findOne({
              where: {
                workflowId: workflow.id,
                targetType: data.targetType,
                targetId: data.targetId,
                status: 'completed',
                completedAt: {
                  [Op.gte]: new Date(Date.now() - workflow.cooldownMinutes * 60 * 1000)
                }
              }
            });

            if (recentExecution) {
              logger.info(`Workflow ${workflow.id} em cooldown`);
              continue;
            }
          }

          // Criar execução
          const execution = await WorkflowExecution.create({
            workflowId: workflow.id,
            triggerType: eventType,
            triggerData: data,
            targetType: data.targetType,
            targetId: data.targetId,
            organizationId: workflow.organizationId
          });

          // Executar workflow em background
          this.execute(workflow, execution).catch(error => {
            logger.error(`Erro ao executar workflow ${workflow.id}:`, error);
          });
        } catch (error) {
          logger.error(`Erro ao processar workflow ${workflow.id}:`, error);
        }
      }
    } catch (error) {
      logger.error(`Erro ao disparar workflows para evento ${eventType}:`, error);
    }
  }

  checkTriggerConditions(trigger, data) {
    if (!trigger || !trigger.conditions) return true;

    const conditions = trigger.conditions;

    // Verificar cada condição
    for (const [field, expected] of Object.entries(conditions)) {
      const actual = data[field];

      if (Array.isArray(expected)) {
        if (!expected.includes(actual)) return false;
      } else if (expected !== actual) {
        return false;
      }
    }

    return true;
  }
}

export default new WorkflowEngine();
