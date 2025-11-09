# ✅ SOLUÇÃO: Tabela Software Ausente

**Data:** 04/11/2025 23:48  
**Status:** ✅ **RESOLVIDO**

---

## 🐛 PROBLEMA

### **Erro Reportado:**
```
GET /api/inventory/users/:id 500 (Internal Server Error)
GET /api/inventory/clients/:id 500 (Internal Server Error)

error: relation "software" does not exist
```

### **Erro SQL:**
```sql
LEFT OUTER JOIN "software" AS "clientAssets->software" 
ON "clientAssets"."id" = "clientAssets->software"."asset_id"
```

---

## 🔍 CAUSA RAIZ

A tabela `software` **não existia no banco de dados**, mas o código Sequelize estava tentando fazer JOIN com ela através das associações:

```javascript
// models/index.js - Associações existentes
Asset.hasMany(Software, { foreignKey: 'assetId', as: 'software' });
Software.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
```

Quando o controller de inventário tentava buscar assets com software associado, o Sequelize gerava queries com JOIN para uma tabela inexistente.

---

## ✅ SOLUÇÃO APLICADA

### **1. Script de Criação da Tabela**

**Arquivo criado:** `/backend/create-software-table.js`

```javascript
import Software from './src/modules/inventory/softwareModel.js';
import { sequelize } from './src/config/database.js';

async function createSoftwareTable() {
  try {
    console.log('🔨 Criando tabela software...');
    await Software.sync({ force: false });
    console.log('✅ Tabela software criada com sucesso!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createSoftwareTable();
```

### **2. Execução**
```bash
node create-software-table.js
```

### **3. Resultado**
```
✅ Tabela software criada com sucesso!
```

---

## 📊 ESTRUTURA DA TABELA `software`

```sql
CREATE TABLE software (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID NOT NULL REFERENCES assets(id),
  
  -- Identificação
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(255),
  version VARCHAR(255),
  edition VARCHAR(255),
  architecture ENUM('x86', 'x64', 'ARM', 'ARM64', 'Universal'),
  
  -- Categoria
  category ENUM(
    'operating_system', 'office_suite', 'security',
    'development', 'database', 'design',
    'communication', 'browser', 'productivity',
    'utility', 'game', 'other'
  ) DEFAULT 'other',
  
  -- Instalação
  install_date TIMESTAMP,
  install_location VARCHAR(255),
  install_size BIGINT,
  
  -- Licença
  license_type ENUM('perpetual', 'subscription', 'trial', 'free', 'open_source'),
  license_key VARCHAR(255),
  license_expiry DATE,
  is_licensed BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  auto_update BOOLEAN DEFAULT false,
  
  -- Informações adicionais
  publisher VARCHAR(255),
  support_url VARCHAR(255),
  uninstall_string TEXT,
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Índices criados
CREATE INDEX software_organization_id ON software(organization_id);
CREATE INDEX software_asset_id ON software(asset_id);
CREATE INDEX software_name ON software(name);
CREATE INDEX software_vendor ON software(vendor);
CREATE INDEX software_category ON software(category);
CREATE INDEX software_is_active ON software(is_active);
```

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Status |
|---------|--------|
| `/modules/inventory/softwareModel.js` | ✅ Já existia |
| `/modules/models/index.js` | ✅ Já exportado |
| `create-software-table.js` | ✅ Criado (script temporário) |
| **Banco de dados** | ✅ Tabela criada |

---

## 🧪 TESTES

### **Antes:**
```bash
GET /api/inventory/users/:id
❌ 500 - relation "software" does not exist
```

### **Depois:**
```bash
GET /api/inventory/users/:id
✅ 200 - Inventário retornado com sucesso
```

---

## 🔄 ASSOCIAÇÕES SEQUELIZE

```javascript
// Asset ↔ Software (1:N)
Asset.hasMany(Software, { 
  foreignKey: 'assetId', 
  as: 'software' 
});

Software.belongsTo(Asset, { 
  foreignKey: 'assetId', 
  as: 'asset' 
});

// Organization ↔ Software (1:N)
Organization.hasMany(Software, { 
  foreignKey: 'organizationId', 
  as: 'software' 
});

Software.belongsTo(Organization, { 
  foreignKey: 'organizationId', 
  as: 'organization' 
});
```

---

## 🎯 USO DO MODELO SOFTWARE

### **Casos de Uso:**

1. **Inventário de Software por Asset**
   ```javascript
   const asset = await Asset.findOne({
     where: { id: assetId },
     include: [{ model: Software, as: 'software' }]
   });
   ```

2. **Software Instalado por Cliente**
   ```javascript
   const user = await User.findOne({
     where: { id: userId },
     include: [{
       model: Asset,
       as: 'clientAssets',
       include: [{ model: Software, as: 'software' }]
     }]
   });
   ```

3. **Licenças a Expirar**
   ```javascript
   const expiringSoftware = await Software.findAll({
     where: {
       licenseExpiry: {
         [Op.between]: [new Date(), thirtyDaysFromNow]
       }
     }
   });
   ```

---

## ⚠️ NOTA IMPORTANTE

Este script é **temporário** para desenvolvimento. Em produção, use **migrações Sequelize** adequadas:

```javascript
// migration/YYYYMMDD-create-software-table.js
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('software', {
    // ... definição da tabela
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('software');
}
```

---

## ✅ RESULTADO FINAL

```
✅ Tabela software criada
✅ Associações Sequelize funcionando
✅ Endpoints de inventário OK
✅ 6 índices otimizados
✅ 3 ENUMs criados
```

---

## 📚 RELACIONADO

- **Modelo:** `/backend/src/modules/inventory/softwareModel.js`
- **Associações:** `/backend/src/modules/models/index.js` (linhas 364-367)
- **Controller:** `/backend/src/modules/inventory/inventoryController.js`

---

**Problema 100% resolvido! Endpoints de inventário funcionando! 🚀**

**Última atualização:** 04/11/2025 23:48  
**Backend:** ✅ Tabela criada  
**Frontend:** ✅ Endpoints funcionando
