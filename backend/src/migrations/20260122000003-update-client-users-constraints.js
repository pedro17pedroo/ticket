export const up = async ({ context: queryInterface }) => {
  const { Sequelize } = queryInterface;

  console.log('🔄 Atualizando constraints da tabela client_users...');

  // 1. Remover constraint unique do campo email (se existir)
  // Primeiro, verificar se existe um índice unique no email
  const [uniqueConstraints] = await queryInterface.sequelize.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'client_users'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%email%';
  `);

  // Remover constraints unique do email
  for (const constraint of uniqueConstraints) {
    console.log(`  Removendo constraint: ${constraint.constraint_name}`);
    await queryInterface.sequelize.query(`
      ALTER TABLE client_users DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};
    `);
  }

  // Verificar e remover índices unique no email
  const [uniqueIndexes] = await queryInterface.sequelize.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'client_users'
      AND indexdef LIKE '%UNIQUE%'
      AND indexdef LIKE '%email%'
      AND indexdef NOT LIKE '%client_id%';
  `);

  for (const index of uniqueIndexes) {
    console.log(`  Removendo índice unique: ${index.indexname}`);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS ${index.indexname};
    `);
  }

  // 2. Adicionar constraint unique composto (email, client_id)
  console.log('  Adicionando constraint unique composto (email, client_id)...');
  await queryInterface.addIndex('client_users', ['email', 'client_id'], {
    unique: true,
    name: 'client_users_email_client_unique'
  });

  // 3. Adicionar índice no client_id para melhor performance
  console.log('  Adicionando índice em client_id...');
  await queryInterface.addIndex('client_users', ['client_id'], {
    name: 'client_users_client_id_idx'
  });

  console.log('✅ Constraints da tabela client_users atualizadas com sucesso!');
  console.log('   - Email não é mais unique globalmente');
  console.log('   - Adicionado unique constraint composto (email, client_id)');
  console.log('   - Mesmo email pode existir em múltiplos client_id');
};

export const down = async ({ context: queryInterface }) => {
  console.log('🔄 Revertendo alterações na tabela client_users...');

  // 1. Remover constraint unique composto
  console.log('  Removendo constraint unique composto...');
  await queryInterface.removeIndex('client_users', 'client_users_email_client_unique');

  // 2. Remover índice do client_id
  console.log('  Removendo índice de client_id...');
  await queryInterface.removeIndex('client_users', 'client_users_client_id_idx');

  // 3. Adicionar constraint unique no email (comportamento original)
  // ATENÇÃO: Isso pode falhar se houver emails duplicados
  console.log('  Adicionando constraint unique no email...');
  try {
    await queryInterface.addIndex('client_users', ['email'], {
      unique: true,
      name: 'client_users_email_unique'
    });
    console.log('✅ Constraint unique no email restaurada');
  } catch (error) {
    console.error('⚠️  Não foi possível restaurar constraint unique no email');
    console.error('   Pode haver emails duplicados na tabela');
    console.error('   Erro:', error.message);
  }

  console.log('✅ Alterações revertidas');
};
