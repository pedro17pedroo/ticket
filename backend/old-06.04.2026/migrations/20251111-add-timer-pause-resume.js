export const up = async (queryInterface, Sequelize) => {
  // Adicionar campo status (enum)
  await queryInterface.addColumn('time_entries', 'status', {
    type: Sequelize.ENUM('running', 'paused', 'stopped'),
    defaultValue: 'running',
    comment: 'Timer status: running, paused, or stopped'
  });

  // Adicionar campo total_paused_time
  await queryInterface.addColumn('time_entries', 'total_paused_time', {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: 'Total paused time in seconds'
  });

  // Adicionar campo last_pause_start
  await queryInterface.addColumn('time_entries', 'last_pause_start', {
    type: Sequelize.DATE,
    allowNull: true,
    comment: 'Timestamp when timer was last paused'
  });

  // Atualizar registros existentes para status 'stopped' se não estiverem ativos
  await queryInterface.sequelize.query(`
    UPDATE time_entries 
    SET status = CASE 
      WHEN is_active = true THEN 'running'
      ELSE 'stopped'
    END
    WHERE status IS NULL;
  `);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('time_entries', 'last_pause_start');
  await queryInterface.removeColumn('time_entries', 'total_paused_time');
  await queryInterface.removeColumn('time_entries', 'status');
  
  // Remover o tipo ENUM
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS "enum_time_entries_status";
  `);
};
