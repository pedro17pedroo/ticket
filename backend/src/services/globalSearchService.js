import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../config/database.js';
import { 
  Ticket, User, KnowledgeArticle, CatalogCategory, 
  Department, Comment, Asset 
} from '../modules/models/index.js';
import SearchIndex from '../models/SearchIndex.js';
import SavedSearch from '../models/SavedSearch.js';
import logger from '../config/logger.js';

class GlobalSearchService {
  constructor() {
    this.entityIndexers = {
      'ticket': this.indexTicket.bind(this),
      'user': this.indexUser.bind(this),
      'article': this.indexArticle.bind(this),
      'asset': this.indexAsset.bind(this)
    };

    this.searchableFields = {
      'ticket': ['ticketNumber', 'subject', 'description'],
      'user': ['name', 'email', 'username'],
      'article': ['title', 'content'],
      'asset': ['name', 'serialNumber', 'description']
    };
  }

  // ===== INDEXAÇÃO =====

  async indexEntity(entityType, entityId, organizationId) {
    try {
      const indexer = this.entityIndexers[entityType];
      
      if (!indexer) {
        logger.warn(`Indexador não encontrado para tipo: ${entityType}`);
        return null;
      }

      const indexData = await indexer(entityId, organizationId);
      
      if (!indexData) {
        return null;
      }

      // Buscar índice existente
      const existing = await SearchIndex.findOne({
        where: {
          entityType,
          entityId,
          organizationId
        }
      });

      if (existing) {
        await existing.update(indexData);
        return existing;
      }

      // Criar novo índice
      return await SearchIndex.create({
        entityType,
        entityId,
        organizationId,
        ...indexData
      });
    } catch (error) {
      logger.error(`Erro ao indexar ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  async indexTicket(ticketId, organizationId) {
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId },
      include: [
        { model: User, as: 'requester', attributes: ['name'] },
        { model: Category, as: 'category', attributes: ['name'] },
        { model: Comment, as: 'comments', attributes: ['content'] }
      ]
    });

    if (!ticket) return null;

    const commentsText = ticket.comments?.map(c => c.content).join(' ') || '';

    return {
      title: `#${ticket.ticketNumber} - ${ticket.subject}`,
      content: `${ticket.description} ${commentsText}`,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        requester: ticket.requester?.name,
        category: ticket.category?.name
      },
      tags: ticket.tags || [],
      status: ticket.status,
      priority: ticket.priority,
      categoryId: ticket.categoryId,
      departmentId: ticket.departmentId
    };
  }

  async indexUser(userId, organizationId) {
    const user = await User.findOne({
      where: { id: userId, organizationId },
      include: [
        { model: Department, as: 'department', attributes: ['name'] }
      ]
    });

    if (!user) return null;

    return {
      title: user.name,
      content: `${user.email} ${user.username || ''} ${user.phone || ''}`,
      metadata: {
        email: user.email,
        role: user.role,
        department: user.department?.name
      },
      tags: [],
      status: user.active ? 'active' : 'inactive',
      departmentId: user.departmentId
    };
  }

  async indexArticle(articleId, organizationId) {
    const article = await KnowledgeArticle.findOne({
      where: { id: articleId, organizationId },
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: User, as: 'author', attributes: ['name'] }
      ]
    });

    if (!article) return null;

    return {
      title: article.title,
      content: article.content,
      metadata: {
        author: article.author?.name,
        category: article.category?.name,
        views: article.viewCount
      },
      tags: article.tags || [],
      status: article.status,
      categoryId: article.categoryId
    };
  }

  async indexAsset(assetId, organizationId) {
    const asset = await Asset.findOne({
      where: { id: assetId, organizationId },
      include: [
        { model: User, as: 'assignedTo', attributes: ['name'] },
        { model: Department, as: 'department', attributes: ['name'] }
      ]
    });

    if (!asset) return null;

    return {
      title: asset.name,
      content: `${asset.serialNumber} ${asset.description || ''} ${asset.model || ''}`,
      metadata: {
        type: asset.type,
        assignedTo: asset.assignedTo?.name,
        department: asset.department?.name
      },
      tags: asset.tags || [],
      status: asset.status,
      departmentId: asset.departmentId
    };
  }

  async reindexAll(organizationId, entityType = null) {
    try {
      const types = entityType ? [entityType] : Object.keys(this.entityIndexers);
      let totalIndexed = 0;

      for (const type of types) {
        const entities = await this.getEntitiesByType(type, organizationId);
        
        for (const entity of entities) {
          await this.indexEntity(type, entity.id, organizationId);
          totalIndexed++;
        }
      }

      return {
        success: true,
        totalIndexed,
        types
      };
    } catch (error) {
      logger.error('Erro ao reindexar:', error);
      throw error;
    }
  }

  async getEntitiesByType(type, organizationId) {
    const models = {
      'ticket': Ticket,
      'user': User,
      'article': KnowledgeArticle,
      'asset': Asset
    };

    const Model = models[type];
    if (!Model) return [];

    return await Model.findAll({
      where: { organizationId },
      attributes: ['id'],
      raw: true
    });
  }

  // ===== BUSCA =====

  async search(organizationId, query, options = {}) {
    try {
      const {
        entityTypes = [],
        filters = {},
        fuzzy = true,
        limit = 50,
        offset = 0,
        sortBy = 'relevance'
      } = options;

      // Construir condições de busca
      const where = {
        organizationId
      };

      if (entityTypes.length > 0) {
        where.entityType = { [Op.in]: entityTypes };
      }

      // Aplicar filtros
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.departmentId) where.departmentId = filters.departmentId;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { [Op.overlap]: filters.tags };
      }

      // Busca com PostgreSQL Full-Text Search (se disponível)
      if (sequelize.getDialect() === 'postgres' && !fuzzy) {
        return await this.postgresFullTextSearch(where, query, limit, offset);
      }

      // Busca padrão com LIKE (fuzzy matching)
      return await this.standardSearch(where, query, fuzzy, limit, offset, sortBy);
    } catch (error) {
      logger.error('Erro na busca:', error);
      throw error;
    }
  }

  async postgresFullTextSearch(where, query, limit, offset) {
    const tsquery = query.split(' ').join(' & ');
    
    const results = await SearchIndex.findAndCountAll({
      where: {
        ...where,
        [Op.or]: [
          literal(`search_vector @@ to_tsquery('portuguese', '${tsquery}')`)
        ]
      },
      order: [
        [literal(`ts_rank(search_vector, to_tsquery('portuguese', '${tsquery}'))`), 'DESC']
      ],
      limit,
      offset
    });

    return this.formatResults(results.rows, results.count, query);
  }

  async standardSearch(where, query, fuzzy, limit, offset, sortBy) {
    const searchConditions = [];
    const queryTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);

    if (fuzzy) {
      // Fuzzy matching - busca por termos parciais
      queryTerms.forEach(term => {
        searchConditions.push(
          { title: { [Op.iLike]: `%${term}%` } },
          { content: { [Op.iLike]: `%${term}%` } }
        );
      });
    } else {
      // Exact matching
      searchConditions.push(
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } }
      );
    }

    const results = await SearchIndex.findAndCountAll({
      where: {
        ...where,
        [Op.or]: searchConditions
      },
      order: this.getOrderClause(sortBy, query),
      limit,
      offset
    });

    return this.formatResults(results.rows, results.count, query);
  }

  getOrderClause(sortBy, query) {
    switch (sortBy) {
      case 'date':
        return [['updated_at', 'DESC']];
      case 'relevance':
      default:
        // Ordenar por relevância (título tem mais peso)
        return [
          [literal(`CASE 
            WHEN LOWER(title) LIKE LOWER('%${query}%') THEN 1 
            ELSE 2 
          END`), 'ASC'],
          ['updated_at', 'DESC']
        ];
    }
  }

  formatResults(rows, total, query) {
    const results = rows.map(row => {
      // Calcular score de relevância simples
      const titleMatch = row.title?.toLowerCase().includes(query.toLowerCase()) ? 10 : 0;
      const contentMatch = row.content?.toLowerCase().includes(query.toLowerCase()) ? 5 : 0;
      const relevanceScore = titleMatch + contentMatch;

      // Highlight dos termos encontrados
      const highlight = this.highlightMatches(row.title, row.content, query);

      return {
        id: row.entityId,
        type: row.entityType,
        title: row.title,
        snippet: highlight.snippet,
        metadata: row.metadata,
        tags: row.tags,
        status: row.status,
        priority: row.priority,
        relevanceScore,
        updatedAt: row.updatedAt
      };
    });

    // Ordenar por relevância
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results,
      total,
      query,
      hasMore: total > (rows.length)
    };
  }

  highlightMatches(title, content, query) {
    const terms = query.toLowerCase().split(' ');
    let snippet = content?.substring(0, 200) || '';

    // Encontrar posição do primeiro match
    let firstMatchPos = -1;
    for (const term of terms) {
      const pos = content?.toLowerCase().indexOf(term);
      if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
        firstMatchPos = pos;
      }
    }

    // Extrair snippet ao redor do match
    if (firstMatchPos !== -1) {
      const start = Math.max(0, firstMatchPos - 50);
      const end = Math.min(content.length, firstMatchPos + 150);
      snippet = (start > 0 ? '...' : '') + 
                content.substring(start, end) + 
                (end < content.length ? '...' : '');
    }

    return { snippet };
  }

  // ===== SUGGESTIONS =====

  async getSuggestions(organizationId, partialQuery, limit = 10) {
    const results = await SearchIndex.findAll({
      where: {
        organizationId,
        [Op.or]: [
          { title: { [Op.iLike]: `${partialQuery}%` } },
          { title: { [Op.iLike]: `% ${partialQuery}%` } }
        ]
      },
      attributes: ['title', 'entityType'],
      group: ['title', 'entity_type'],
      limit
    });

    return results.map(r => ({
      text: r.title,
      type: r.entityType
    }));
  }

  // ===== SAVED SEARCHES =====

  async saveSearch(userId, organizationId, searchData) {
    return await SavedSearch.create({
      ...searchData,
      userId,
      organizationId
    });
  }

  async getSavedSearches(userId, organizationId) {
    return await SavedSearch.findAll({
      where: {
        [Op.or]: [
          { userId, organizationId },
          { isPublic: true, organizationId }
        ]
      },
      order: [
        ['is_favorite', 'DESC'],
        ['execution_count', 'DESC'],
        ['name', 'ASC']
      ]
    });
  }

  async executeSavedSearch(searchId, userId, organizationId) {
    const savedSearch = await SavedSearch.findOne({
      where: {
        id: searchId,
        [Op.or]: [
          { userId },
          { isPublic: true }
        ],
        organizationId
      }
    });

    if (!savedSearch) {
      throw new Error('Busca salva não encontrada');
    }

    // Executar busca
    const results = await this.search(
      organizationId,
      savedSearch.query,
      {
        entityTypes: savedSearch.entityTypes,
        filters: savedSearch.filters
      }
    );

    // Atualizar estatísticas
    await savedSearch.update({
      executionCount: savedSearch.executionCount + 1,
      lastExecutedAt: new Date()
    });

    return results;
  }

  // ===== RECENT SEARCHES =====

  async getRecentSearches(userId, limit = 10) {
    // Buscar nas saved searches com lastExecutedAt mais recente
    return await SavedSearch.findAll({
      where: {
        userId,
        lastExecutedAt: { [Op.not]: null }
      },
      order: [['last_executed_at', 'DESC']],
      limit
    });
  }

  // ===== STATISTICS =====

  async getSearchStatistics(organizationId, startDate, endDate) {
    const topSearches = await SavedSearch.findAll({
      where: {
        organizationId,
        lastExecutedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['execution_count', 'DESC']],
      limit: 10
    });

    const indexStats = await SearchIndex.count({
      where: { organizationId },
      group: ['entity_type']
    });

    return {
      topSearches,
      indexedEntities: indexStats,
      totalIndexed: await SearchIndex.count({ where: { organizationId } })
    };
  }
}

export default new GlobalSearchService();
