import { Op } from 'sequelize';
import Workflow from '../../models/Workflow.js';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import WorkflowEngine from './workflowEngine.js';
import logger from '../../config/logger.js';

class WorkflowController {
  // ===== WORKFLOW MANAGEMENT =====
  
  async getWorkflows(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, isActive = true } = req.query;

      const where = {
        organizationId,
        ...(type && { type }),
        ...(isActive !== undefined && { isActive })
      };

      const workflows = await Workflow.findAll({
        where,
        order: [
          ['priority', 'ASC'],
          ['name', 'ASC']
        ]
      });

      res.json(workflows);
    } catch (error) {
      logger.error('Erro ao buscar workflows:', error);
      res.status(500).json({ error: 'Erro ao buscar workflows' });
    }
  }

  async getWorkflowById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const workflow = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      res.json(workflow);
    } catch (error) {
      logger.error('Erro ao buscar workflow:', error);
      res.status(500).json({ error: 'Erro ao buscar workflow' });
    }
  }

  async createWorkflow(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;
      
      // Validar estrutura do workflow
      const validation = this.validateWorkflow(req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Workflow inválido', 
          details: validation.errors 
        });
      }

      const workflow = await Workflow.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(workflow);
    } catch (error) {
      logger.error('Erro ao criar workflow:', error);
      res.status(500).json({ error: 'Erro ao criar workflow' });
    }
  }

  async updateWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const workflow = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (workflow.isSystem) {
        return res.status(403).json({ error: 'Workflows do sistema não podem ser editados' });
      }

      // Validar estrutura do workflow
      const validation = this.validateWorkflow(req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Workflow inválido', 
          details: validation.errors 
        });
      }

      await workflow.update(req.body);

      res.json(workflow);
    } catch (error) {
      logger.error('Erro ao atualizar workflow:', error);
      res.status(500).json({ error: 'Erro ao atualizar workflow' });
    }
  }

  async deleteWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const workflow = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      if (workflow.isSystem) {
        return res.status(403).json({ error: 'Workflows do sistema não podem ser removidos' });
      }

      await workflow.destroy();

      res.json({ message: 'Workflow removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover workflow:', error);
      res.status(500).json({ error: 'Erro ao remover workflow' });
    }
  }

  async toggleWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const workflow = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      await workflow.update({
        isActive: !workflow.isActive
      });

      res.json({
        id: workflow.id,
        isActive: workflow.isActive,
        message: workflow.isActive ? 'Workflow ativado' : 'Workflow desativado'
      });
    } catch (error) {
      logger.error('Erro ao alternar workflow:', error);
      res.status(500).json({ error: 'Erro ao alternar workflow' });
    }
  }

  async duplicateWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const { organizationId, id: createdById } = req.user;

      const original = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!original) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      const duplicate = await Workflow.create({
        name: name || `${original.name} (Cópia)`,
        description: original.description,
        type: original.type,
        trigger: original.trigger,
        steps: original.steps,
        variables: original.variables,
        schedule: original.schedule,
        isActive: false, // Desativado por padrão
        priority: original.priority,
        maxExecutions: original.maxExecutions,
        cooldownMinutes: original.cooldownMinutes,
        organizationId,
        createdById
      });

      res.status(201).json(duplicate);
    } catch (error) {
      logger.error('Erro ao duplicar workflow:', error);
      res.status(500).json({ error: 'Erro ao duplicar workflow' });
    }
  }

  // ===== WORKFLOW EXECUTION =====

  async executeWorkflow(req, res) {
    try {
      const { workflowId, targetType, targetId, data = {} } = req.body;
      const { organizationId, id: userId } = req.user;

      const workflow = await Workflow.findOne({
        where: { 
          id: workflowId, 
          organizationId,
          isActive: true
        }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado ou inativo' });
      }

      // Verificar cooldown
      if (workflow.cooldownMinutes > 0) {
        const recentExecution = await WorkflowExecution.findOne({
          where: {
            workflowId,
            targetType,
            targetId,
            status: 'completed',
            completedAt: {
              [Op.gte]: new Date(Date.now() - workflow.cooldownMinutes * 60 * 1000)
            }
          }
        });

        if (recentExecution) {
          return res.status(429).json({ 
            error: 'Workflow em cooldown',
            nextAvailable: new Date(recentExecution.completedAt.getTime() + workflow.cooldownMinutes * 60 * 1000)
          });
        }
      }

      // Criar execução
      const execution = await WorkflowExecution.create({
        workflowId,
        triggerType: 'manual',
        triggerData: data,
        targetType,
        targetId,
        organizationId,
        executedById: userId
      });

      // Executar workflow em background
      WorkflowEngine.execute(workflow, execution).catch(error => {
        logger.error(`Erro na execução do workflow ${workflowId}:`, error);
      });

      res.status(202).json({
        executionId: execution.id,
        status: 'started',
        message: 'Workflow iniciado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao executar workflow:', error);
      res.status(500).json({ error: 'Erro ao executar workflow' });
    }
  }

  async testWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { targetType = 'test', targetId = 0, data = {} } = req.body;
      const { organizationId, id: userId } = req.user;

      const workflow = await Workflow.findOne({
        where: { id, organizationId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow não encontrado' });
      }

      // Criar execução de teste
      const execution = await WorkflowExecution.create({
        workflowId: id,
        triggerType: 'test',
        triggerData: data,
        targetType,
        targetId,
        organizationId,
        executedById: userId
      });

      // Executar workflow em modo teste (síncrono)
      const result = await WorkflowEngine.executeTest(workflow, execution);

      res.json({
        executionId: execution.id,
        status: result.status,
        steps: result.steps,
        result: result.result,
        error: result.error,
        duration: result.duration
      });
    } catch (error) {
      logger.error('Erro ao testar workflow:', error);
      res.status(500).json({ error: 'Erro ao testar workflow' });
    }
  }

  async getExecutions(req, res) {
    try {
      const { organizationId } = req.user;
      const { 
        workflowId, 
        status, 
        targetType, 
        targetId,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = req.query;

      const where = {
        organizationId,
        ...(workflowId && { workflowId }),
        ...(status && { status }),
        ...(targetType && { targetType }),
        ...(targetId && { targetId })
      };

      if (startDate || endDate) {
        where.startedAt = {};
        if (startDate) where.startedAt[Op.gte] = new Date(startDate);
        if (endDate) where.startedAt[Op.lte] = new Date(endDate);
      }

      const executions = await WorkflowExecution.findAndCountAll({
        where,
        include: [
          { 
            model: Workflow, 
            as: 'workflow',
            attributes: ['id', 'name', 'type']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        total: executions.count,
        executions: executions.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      logger.error('Erro ao buscar execuções:', error);
      res.status(500).json({ error: 'Erro ao buscar execuções' });
    }
  }

  async getExecutionById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const execution = await WorkflowExecution.findOne({
        where: { id, organizationId },
        include: [
          { 
            model: Workflow, 
            as: 'workflow'
          }
        ]
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execução não encontrada' });
      }

      res.json(execution);
    } catch (error) {
      logger.error('Erro ao buscar execução:', error);
      res.status(500).json({ error: 'Erro ao buscar execução' });
    }
  }

  async cancelExecution(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const execution = await WorkflowExecution.findOne({
        where: { 
          id, 
          organizationId,
          status: ['pending', 'running', 'paused']
        }
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execução não encontrada ou já finalizada' });
      }

      await execution.update({
        status: 'cancelled',
        completedAt: new Date(),
        error: 'Cancelado pelo usuário'
      });

      res.json({
        id: execution.id,
        status: 'cancelled',
        message: 'Execução cancelada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao cancelar execução:', error);
      res.status(500).json({ error: 'Erro ao cancelar execução' });
    }
  }

  async retryExecution(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const execution = await WorkflowExecution.findOne({
        where: { 
          id, 
          organizationId,
          status: 'failed'
        },
        include: [
          { model: Workflow, as: 'workflow' }
        ]
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execução não encontrada ou não falhou' });
      }

      // Verificar se pode tentar novamente
      if (execution.retryCount >= execution.maxRetries) {
        return res.status(400).json({ error: 'Número máximo de tentativas excedido' });
      }

      // Resetar execução
      await execution.update({
        status: 'pending',
        retryCount: execution.retryCount + 1,
        error: null,
        errorDetails: null
      });

      // Re-executar workflow
      WorkflowEngine.execute(execution.workflow, execution).catch(error => {
        logger.error(`Erro no retry do workflow ${execution.workflowId}:`, error);
      });

      res.json({
        id: execution.id,
        status: 'restarted',
        retryCount: execution.retryCount,
        message: 'Execução reiniciada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao reiniciar execução:', error);
      res.status(500).json({ error: 'Erro ao reiniciar execução' });
    }
  }

  // ===== STATISTICS =====

  async getStatistics(req, res) {
    try {
      const { organizationId } = req.user;
      const { period = '7d' } = req.query;

      const startDate = this.getStartDateFromPeriod(period);

      // Estatísticas gerais
      const [
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgDuration
      ] = await Promise.all([
        Workflow.count({ where: { organizationId } }),
        Workflow.count({ where: { organizationId, isActive: true } }),
        WorkflowExecution.count({ 
          where: { 
            organizationId,
            startedAt: { [Op.gte]: startDate }
          } 
        }),
        WorkflowExecution.count({ 
          where: { 
            organizationId,
            status: 'completed',
            startedAt: { [Op.gte]: startDate }
          } 
        }),
        WorkflowExecution.count({ 
          where: { 
            organizationId,
            status: 'failed',
            startedAt: { [Op.gte]: startDate }
          } 
        }),
        WorkflowExecution.findOne({
          where: { 
            organizationId,
            status: 'completed',
            startedAt: { [Op.gte]: startDate }
          },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration']
          ],
          raw: true
        })
      ]);

      // Top workflows por execução
      const topWorkflows = await WorkflowExecution.findAll({
        where: {
          organizationId,
          startedAt: { [Op.gte]: startDate }
        },
        attributes: [
          'workflowId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'executions'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'successful'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed']
        ],
        include: [
          {
            model: Workflow,
            as: 'workflow',
            attributes: ['name', 'type']
          }
        ],
        group: ['workflowId', 'workflow.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 5
      });

      res.json({
        summary: {
          totalWorkflows,
          activeWorkflows,
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          successRate: totalExecutions > 0 
            ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
            : 0,
          avgDuration: avgDuration?.avgDuration || 0
        },
        topWorkflows,
        period
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  // ===== HELPER METHODS =====

  validateWorkflow(workflow) {
    const errors = [];

    // Validar nome
    if (!workflow.name) {
      errors.push('Nome é obrigatório');
    }

    // Validar tipo
    const validTypes = [
      'ticket_created', 'ticket_updated', 'ticket_assigned',
      'ticket_status_changed', 'comment_added', 'time_based',
      'sla_breach', 'custom'
    ];
    if (workflow.type && !validTypes.includes(workflow.type)) {
      errors.push('Tipo de workflow inválido');
    }

    // Validar steps
    if (workflow.steps && Array.isArray(workflow.steps)) {
      const stepIds = new Set();
      
      for (const step of workflow.steps) {
        if (!step.id) {
          errors.push('Todos os passos devem ter um ID');
          continue;
        }
        
        if (stepIds.has(step.id)) {
          errors.push(`ID de passo duplicado: ${step.id}`);
        }
        stepIds.add(step.id);

        if (!step.type || !['condition', 'action', 'wait', 'approval'].includes(step.type)) {
          errors.push(`Tipo de passo inválido: ${step.type}`);
        }
      }

      // Validar referências entre steps
      for (const step of workflow.steps) {
        if (step.next && !stepIds.has(step.next)) {
          errors.push(`Referência inválida: step ${step.id} aponta para ${step.next} inexistente`);
        }
        if (step.type === 'condition') {
          if (step.onTrue && !stepIds.has(step.onTrue)) {
            errors.push(`Referência inválida: step ${step.id} onTrue aponta para ${step.onTrue} inexistente`);
          }
          if (step.onFalse && !stepIds.has(step.onFalse)) {
            errors.push(`Referência inválida: step ${step.id} onFalse aponta para ${step.onFalse} inexistente`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getStartDateFromPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

export default new WorkflowController();
