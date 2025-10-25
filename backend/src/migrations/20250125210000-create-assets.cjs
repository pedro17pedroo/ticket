module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('desktop', 'laptop', 'server', 'tablet', 'smartphone', 'printer', 'network_device', 'other'),
        allowNull: false,
        defaultValue: 'desktop'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen'),
        allowNull: false,
        defaultValue: 'active'
      },
      manufacturer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      asset_tag: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      processor_cores: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ram: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ram_g_b: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      storage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      storage_g_b: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      storage_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      graphics_card: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os_build: {
        type: Sequelize.STRING,
        allowNull: true
      },
      os_architecture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hostname: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mac_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: true
      },
      has_antivirus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      antivirus_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      antivirus_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      antivirus_updated: {
        type: Sequelize.DATE,
        allowNull: true
      },
      has_firewall: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_encrypted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      warranty_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_seen: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_inventory_scan: {
        type: Sequelize.DATE,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      building: {
        type: Sequelize.STRING,
        allowNull: true
      },
      floor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      room: {
        type: Sequelize.STRING,
        allowNull: true
      },
      purchase_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      current_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      collection_method: {
        type: Sequelize.ENUM('manual', 'script', 'agent', 'api'),
        defaultValue: 'manual'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar índices
    await queryInterface.addIndex('assets', ['organization_id']);
    await queryInterface.addIndex('assets', ['client_id']);
    await queryInterface.addIndex('assets', ['user_id']);
    await queryInterface.addIndex('assets', ['status']);
    await queryInterface.addIndex('assets', ['type']);
    await queryInterface.addIndex('assets', ['serial_number']);
    await queryInterface.addIndex('assets', ['hostname']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('assets');
  }
};
