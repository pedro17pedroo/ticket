import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuração PostgreSQL (Banco principal)
export const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
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

// Configuração MongoDB (Logs e auditoria)
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    process.exit(1);
  }
};

// Testar conexão PostgreSQL
export const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado com sucesso');
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
