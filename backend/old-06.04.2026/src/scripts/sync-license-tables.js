/**
 * Script para criar/sincronizar tabelas de licenças
 * Executar: node src/scripts/sync-license-tables.js
 */

import { License, AssetLicense } from '../modules/models/index.js';

async function syncLicenseTables() {
  try {
    console.log('🔄 Sincronizando tabelas de licenças...\n');

    // Sincronizar tabela de licenças
    await License.sync({ alter: true });
    console.log('✅ Tabela licenses criada/atualizada');

    // Sincronizar tabela de associação asset-license
    await AssetLicense.sync({ alter: true });
    console.log('✅ Tabela asset_licenses criada/atualizada');

    console.log('\n✅ Todas as tabelas de licenças sincronizadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabelas:', error);
    process.exit(1);
  }
}

syncLicenseTables();
