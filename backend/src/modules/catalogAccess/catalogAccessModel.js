import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Catalog Access Control Model
 * 
 * Controle de acesso granular ao catálogo de serviços.
 * Permite definir permissões por:
 * - Estrutura organizacional (Direção, Departamento, Secção)
 * - Usuário individual
 * - Cliente (empresa)
 * 
 * Hierarquia de permissões:
 * 1. Deny tem precedência sobre Allow
 * 2. Permissão de usuário sobrepõe estrutura
 * 3. Herança: Categoria pai → Subcategorias → Itens
 */
export const CatalogAccessControl = sequelize.define('CatalogAccessControl', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    },
    comment: 'Organização proprietária'
  },
  // Entidade que tem acesso
  entityType: {
    type: DataTypes.ENUM('direction', 'department', 'section', 'user', 'client'),
    allowNull: false,
    comment: 'Tipo de entidade: direction, department, section, user, client'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'UUID da entidade (direção, departamento, secção, usuário ou cliente)'
  },
  // Recurso do catálogo
  resourceType: {
    type: DataTypes.ENUM('category', 'item'),
    allowNull: false,
    comment: 'Tipo de recurso: category, item'
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'UUID do recurso (categoria ou item do catálogo)'
  },
  // Tipo de acesso
  accessType: {
    type: DataTypes.ENUM('allow', 'deny'),
    allowNull: false,
    defaultValue: 'allow',
    comment: 'Tipo de acesso: allow (permitir), deny (negar - tem precedência)'
  },
  // Metadados
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organization_users',
      key: 'id'
    },
    comment: 'Usuário que criou a regra'
  }
}, {
  tableName: 'catalog_access_control',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      fields: ['entity_type', 'entity_id'],
      name: 'idx_catalog_acl_entity'
    },
    {
      fields: ['resource_type', 'resource_id'],
      name: 'idx_catalog_acl_resource'
    },
    {
      fields: ['organization_id'],
      name: 'idx_catalog_acl_org'
    },
    {
      fields: ['entity_type', 'entity_id', 'resource_type', 'resource_id'],
      name: 'idx_catalog_acl_entity_resource'
    },
    {
      unique: true,
      fields: ['organization_id', 'entity_type', 'entity_id', 'resource_type', 'resource_id'],
      name: 'unique_catalog_acl'
    }
  ]
});

/**
 * Métodos estáticos para consultas comuns
 */

/**
 * Buscar regras de acesso para uma entidade
 * @param {string} entityType - Tipo da entidade
 * @param {string} entityId - UUID da entidade
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<Array>} Lista de regras
 */
CatalogAccessControl.findByEntity = async function(entityType, entityId, organizationId) {
  return await this.findAll({
    where: {
      organizationId,
      entityType,
      entityId
    }
  });
};

/**
 * Buscar regras de acesso para um recurso
 * @param {string} resourceType - Tipo do recurso
 * @param {string} resourceId - UUID do recurso
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<Array>} Lista de regras
 */
CatalogAccessControl.findByResource = async function(resourceType, resourceId, organizationId) {
  return await this.findAll({
    where: {
      organizationId,
      resourceType,
      resourceId
    }
  });
};

/**
 * Verificar se existe regra de acesso
 * @param {string} entityType - Tipo da entidade
 * @param {string} entityId - UUID da entidade
 * @param {string} resourceType - Tipo do recurso
 * @param {string} resourceId - UUID do recurso
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<Object|null>} Regra encontrada ou null
 */
CatalogAccessControl.findRule = async function(entityType, entityId, resourceType, resourceId, organizationId) {
  return await this.findOne({
    where: {
      organizationId,
      entityType,
      entityId,
      resourceType,
      resourceId
    }
  });
};

/**
 * Criar ou atualizar regra de acesso
 * @param {Object} data - Dados da regra
 * @returns {Promise<Object>} Regra criada/atualizada
 */
CatalogAccessControl.upsertRule = async function(data) {
  const { organizationId, entityType, entityId, resourceType, resourceId, accessType, createdBy } = data;
  
  const [rule, created] = await this.findOrCreate({
    where: {
      organizationId,
      entityType,
      entityId,
      resourceType,
      resourceId
    },
    defaults: {
      accessType,
      createdBy
    }
  });
  
  if (!created && rule.accessType !== accessType) {
    await rule.update({ accessType });
  }
  
  return rule;
};

/**
 * Remover regra de acesso
 * @param {string} entityType - Tipo da entidade
 * @param {string} entityId - UUID da entidade
 * @param {string} resourceType - Tipo do recurso
 * @param {string} resourceId - UUID do recurso
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<number>} Número de regras removidas
 */
CatalogAccessControl.removeRule = async function(entityType, entityId, resourceType, resourceId, organizationId) {
  return await this.destroy({
    where: {
      organizationId,
      entityType,
      entityId,
      resourceType,
      resourceId
    }
  });
};

/**
 * Remover todas as regras de uma entidade
 * @param {string} entityType - Tipo da entidade
 * @param {string} entityId - UUID da entidade
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<number>} Número de regras removidas
 */
CatalogAccessControl.removeEntityRules = async function(entityType, entityId, organizationId) {
  return await this.destroy({
    where: {
      organizationId,
      entityType,
      entityId
    }
  });
};

/**
 * Remover todas as regras de um recurso
 * @param {string} resourceType - Tipo do recurso
 * @param {string} resourceId - UUID do recurso
 * @param {string} organizationId - UUID da organização
 * @returns {Promise<number>} Número de regras removidas
 */
CatalogAccessControl.removeResourceRules = async function(resourceType, resourceId, organizationId) {
  return await this.destroy({
    where: {
      organizationId,
      resourceType,
      resourceId
    }
  });
};

export default CatalogAccessControl;
