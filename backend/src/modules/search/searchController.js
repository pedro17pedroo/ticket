import globalSearchService from '../../services/globalSearchService.js';
import logger from '../../config/logger.js';

class SearchController {
  // ===== SEARCH =====

  async search(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const { 
        q: query,
        types,
        fuzzy = 'true',
        limit = 50,
        offset = 0,
        sortBy = 'relevance',
        ...filters
      } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Query muito curta (mínimo 2 caracteres)' });
      }

      const entityTypes = types ? types.split(',') : [];

      const results = await globalSearchService.search(
        organizationId,
        query,
        {
          entityTypes,
          filters,
          fuzzy: fuzzy === 'true',
          limit: parseInt(limit),
          offset: parseInt(offset),
          sortBy
        }
      );

      res.json(results);
    } catch (error) {
      logger.error('Erro na busca:', error);
      res.status(500).json({ error: 'Erro ao realizar busca' });
    }
  }

  async suggestions(req, res) {
    try {
      const { organizationId } = req.user;
      const { q: query, limit = 10 } = req.query;

      if (!query || query.length < 1) {
        return res.json([]);
      }

      const suggestions = await globalSearchService.getSuggestions(
        organizationId,
        query,
        parseInt(limit)
      );

      res.json(suggestions);
    } catch (error) {
      logger.error('Erro ao buscar sugestões:', error);
      res.status(500).json({ error: 'Erro ao buscar sugestões' });
    }
  }

  // ===== SAVED SEARCHES =====

  async getSavedSearches(req, res) {
    try {
      const { organizationId, id: userId } = req.user;

      const searches = await globalSearchService.getSavedSearches(userId, organizationId);

      res.json(searches);
    } catch (error) {
      logger.error('Erro ao buscar buscas salvas:', error);
      res.status(500).json({ error: 'Erro ao buscar buscas salvas' });
    }
  }

  async saveSearch(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const searchData = req.body;

      const saved = await globalSearchService.saveSearch(userId, organizationId, searchData);

      res.status(201).json(saved);
    } catch (error) {
      logger.error('Erro ao salvar busca:', error);
      res.status(500).json({ error: 'Erro ao salvar busca' });
    }
  }

  async executeSavedSearch(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const results = await globalSearchService.executeSavedSearch(
        parseInt(id),
        userId,
        organizationId
      );

      res.json(results);
    } catch (error) {
      logger.error('Erro ao executar busca salva:', error);
      res.status(500).json({ error: 'Erro ao executar busca salva' });
    }
  }

  async deleteSavedSearch(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const search = await SavedSearch.findOne({
        where: { id, userId }
      });

      if (!search) {
        return res.status(404).json({ error: 'Busca salva não encontrada' });
      }

      await search.destroy();

      res.json({ message: 'Busca removida com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover busca salva:', error);
      res.status(500).json({ error: 'Erro ao remover busca salva' });
    }
  }

  // ===== RECENT SEARCHES =====

  async getRecentSearches(req, res) {
    try {
      const { id: userId } = req.user;
      const { limit = 10 } = req.query;

      const searches = await globalSearchService.getRecentSearches(
        userId,
        parseInt(limit)
      );

      res.json(searches);
    } catch (error) {
      logger.error('Erro ao buscar buscas recentes:', error);
      res.status(500).json({ error: 'Erro ao buscar buscas recentes' });
    }
  }

  // ===== INDEXING =====

  async reindex(req, res) {
    try {
      const { organizationId } = req.user;
      const { entityType } = req.body;

      const result = await globalSearchService.reindexAll(organizationId, entityType);

      res.json(result);
    } catch (error) {
      logger.error('Erro ao reindexar:', error);
      res.status(500).json({ error: 'Erro ao reindexar' });
    }
  }

  async indexEntity(req, res) {
    try {
      const { organizationId } = req.user;
      const { entityType, entityId } = req.body;

      const indexed = await globalSearchService.indexEntity(
        entityType,
        parseInt(entityId),
        organizationId
      );

      if (!indexed) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      res.json({ message: 'Entidade indexada com sucesso', indexed });
    } catch (error) {
      logger.error('Erro ao indexar entidade:', error);
      res.status(500).json({ error: 'Erro ao indexar entidade' });
    }
  }

  // ===== STATISTICS =====

  async getStatistics(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const stats = await globalSearchService.getSearchStatistics(
        organizationId,
        start,
        end
      );

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

export default new SearchController();
