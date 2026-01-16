import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuração PostgreSQL (Banco principal)
export const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  String(process.env.POSTGRES_PASSWORD), // Ensure password is a string
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Configuração MongoDB (Logs e auditoria) - OPCIONAL
export const connectMongoDB = async () => {
  // Se não houver URI do MongoDB configurada, pular conexão
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ MongoDB URI não configurada - auditoria desativada');
    return false;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    console.log('⚠️ Continuando sem MongoDB - auditoria desativada');
    return false;
  }
};

// Testar conexão PostgreSQL
export const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado com sucesso');
    
    // Adicionar novo status ao enum (se não existir)
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'aguardando_aprovacao' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')
          ) THEN
            ALTER TYPE enum_tickets_status ADD VALUE 'aguardando_aprovacao';
          END IF;
        END
        $$;
      `);
      console.log('✅ Enum de status atualizado');
    } catch (enumError) {
      console.log('⚠️  Enum status já atualizado ou erro:', enumError.message);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    process.exit(1);
  }
};

// Sincronizar modelos (apenas em desenvolvimento)
export const syncDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Desabilitado - usar migrations para mudanças de schema
      // await sequelize.sync({ alter: true });
      console.log('✅ Modelos carregados (sync desabilitado)');
    } catch (error) {
      console.error('❌ Erro ao sincronizar modelos:', error.message);
    }
  }
};
