import OrganizationUser from '../models/OrganizationUser.js';
import ClientUser from '../modules/clients/clientUserModel.js';
import logger from '../config/logger.js';

/**
 * Sincroniza a senha entre todos os contextos de um usuário (OrganizationUser e ClientUser)
 * @param {string} email - Email do usuário
 * @param {string} newPasswordHash - Hash da nova senha (já criptografado com bcrypt)
 * @returns {Promise<Object>} Resultado da sincronização
 */
export const syncPasswordAcrossContexts = async (email, newPasswordHash) => {
  try {
    const results = {
      organizationUsers: 0,
      clientUsers: 0,
      errors: []
    };

    // Atualizar todos os OrganizationUsers com este email
    try {
      const [orgUpdateCount] = await OrganizationUser.update(
        { password: newPasswordHash },
        { 
          where: { email, isActive: true },
          individualHooks: false // Evita re-hash da senha
        }
      );
      results.organizationUsers = orgUpdateCount;
      logger.info(`✅ Sincronizados ${orgUpdateCount} OrganizationUser(s) para ${email}`);
    } catch (error) {
      logger.error('Erro ao sincronizar OrganizationUsers:', error);
      results.errors.push({ type: 'organization', error: error.message });
    }

    // Atualizar todos os ClientUsers com este email
    try {
      const [clientUpdateCount] = await ClientUser.update(
        { password: newPasswordHash },
        { 
          where: { email, isActive: true },
          individualHooks: false // Evita re-hash da senha
        }
      );
      results.clientUsers = clientUpdateCount;
      logger.info(`✅ Sincronizados ${clientUpdateCount} ClientUser(s) para ${email}`);
    } catch (error) {
      logger.error('Erro ao sincronizar ClientUsers:', error);
      results.errors.push({ type: 'client', error: error.message });
    }

    const totalSynced = results.organizationUsers + results.clientUsers;
    logger.info(`🔄 Sincronização de senha concluída para ${email}: ${totalSynced} contexto(s) atualizados`);

    return results;
  } catch (error) {
    logger.error('Erro na sincronização de senha:', error);
    throw error;
  }
};

/**
 * Sincroniza a senha entre todos os contextos de um usuário (versão com senha em texto)
 * @param {string} email - Email do usuário
 * @param {string} plainPassword - Senha em texto plano
 * @returns {Promise<Object>} Resultado da sincronização
 */
export const syncPasswordAcrossContextsPlain = async (email, plainPassword) => {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);
  
  return syncPasswordAcrossContexts(email, passwordHash);
};
