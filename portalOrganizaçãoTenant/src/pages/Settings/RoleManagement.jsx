import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Checkbox, 
  Space, 
  message, 
  Tag, 
  Tooltip,
  Descriptions,
  Collapse,
  Typography,
  Alert,
  Radio,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  BankOutlined,
  ShopOutlined
} from '@ant-design/icons';
import rbacService from '../../services/rbacService';
import clientService from '../../services/clientService'; // Assumindo que existe

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

/**
 * Página de Gestão de Roles - Portal Organização
 * Gerente/Supervisor pode gerir roles da ORGANIZAÇÃO + roles dos CLIENTES
 */
const RoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [clients, setClients] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [roleScope, setRoleScope] = useState('organization'); // 'organization' ou 'client'
  const [canCreateForClients, setCanCreateForClients] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadClients();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rbacService.getRoles();
      setRoles(response.roles);
      setCanCreateForClients(response.canCreateForClients);
    } catch (error) {
      message.error('Erro ao carregar roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await rbacService.getPermissions();
      setGroupedPermissions(response.grouped);
    } catch (error) {
      message.error('Erro ao carregar permissões');
      console.error(error);
    }
  };

  const loadClients = async () => {
    try {
      // Assumindo que existe um endpoint para listar clientes
      const response = await clientService.getAll();
      setClients(response.clients || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClients([]);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setRoleScope('organization');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    if (!role.canEdit) {
      message.warning('Não pode editar este role');
      return;
    }
    setSelectedRole(role);
    setRoleScope(role.clientId ? 'client' : 'organization');
    form.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      level: role.level,
      priority: role.priority,
      clientId: role.clientId,
      permissions: role.permissions?.map(p => p.id) || []
    });
    setModalVisible(true);
  };

  const handleView = (role) => {
    setSelectedRole(role);
    setViewModalVisible(true);
  };

  const handleDelete = async (role) => {
    if (!role.canDelete) {
      message.warning('Não pode eliminar este role');
      return;
    }

    Modal.confirm({
      title: 'Eliminar Role',
      content: `Tem certeza que deseja eliminar o role "${role.displayName}"?`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await rbacService.deleteRole(role.id);
          message.success('Role eliminado com sucesso');
          loadRoles();
        } catch (error) {
          message.error(error.response?.data?.error || 'Erro ao eliminar role');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        clientId: roleScope === 'client' ? values.clientId : null
      };

      if (selectedRole) {
        await rbacService.updateRole(selectedRole.id, payload);
        message.success('Role atualizado com sucesso');
      } else {
        await rbacService.createRole(payload);
        message.success('Role criado com sucesso');
      }
      setModalVisible(false);
      form.resetFields();
      loadRoles();
    } catch (error) {
      message.error(error.response?.data?.error || 'Erro ao guardar role');
    }
  };

  const getLevelTag = (level) => {
    const colors = {
      organization: 'purple',
      client: 'blue',
      user: 'green'
    };
    const labels = {
      organization: 'Organização',
      client: 'Cliente',
      user: 'Utilizador'
    };
    return <Tag color={colors[level]}>{labels[level]}</Tag>;
  };

  const getScopeTag = (scope) => {
    const config = {
      system: { color: 'gold', icon: <LockOutlined />, label: 'Sistema' },
      organization: { color: 'purple', icon: <BankOutlined />, label: 'Organização' },
      client: { color: 'blue', icon: <ShopOutlined />, label: 'Cliente' }
    };
    const { color, icon, label } = config[scope] || config.system;
    return <Tag color={color} icon={icon}>{label}</Tag>;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Desconhecido';
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <Space>
          {record.isSystem ? (
            <Tooltip title="Role do Sistema">
              <LockOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          ) : (
            <Tooltip title="Role Customizado">
              <UnlockOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          <strong>{text}</strong>
        </Space>
      ),
      filters: [
        { text: 'Roles do Sistema', value: 'system' },
        { text: 'Roles da Organização', value: 'organization' },
        { text: 'Roles de Clientes', value: 'client' }
      ],
      onFilter: (value, record) => record.scope === value
    },
    {
      title: 'Nome Técnico',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Escopo',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope, record) => (
        <Space direction="vertical" size="small">
          {getScopeTag(scope)}
          {record.clientId && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getClientName(record.clientId)}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Nível',
      dataIndex: 'level',
      key: 'level',
      render: (level) => getLevelTag(level)
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (priority) => (
        <Tag color={priority >= 800 ? 'red' : priority >= 500 ? 'orange' : 'default'}>
          {priority}
        </Tag>
      )
    },
    {
      title: 'Permissões',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      render: (count) => (
        <Tag color="blue">{count} permissões</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver Detalhes">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          
          {record.canEdit && (
            <Tooltip title="Editar">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          
          {record.canDelete && (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3}>
                <TeamOutlined /> Gestão de Roles
              </Title>
              <Text type="secondary">
                Gerir roles da organização e dos clientes
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              Criar Role
            </Button>
          </div>

          {/* Info Alert */}
          <Alert
            message="Gestão de Roles da Organização"
            description={
              <>
                <p>• <strong>Roles do Sistema:</strong> Roles padrão (não podem ser editados)</p>
                <p>• <strong>Roles da Organização:</strong> Roles customizados para a sua organização</p>
                {canCreateForClients && (
                  <p>• <strong>Roles de Clientes:</strong> Roles específicos criados para os seus clientes</p>
                )}
              </>
            }
            type="info"
            showIcon
          />

          {/* Table */}
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} roles`
            }}
          />
        </Space>
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={selectedRole ? 'Editar Role' : 'Criar Role'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={900}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Escopo: Organização ou Cliente */}
          {!selectedRole && canCreateForClients && (
            <>
              <Form.Item label="Criar role para:">
                <Radio.Group 
                  value={roleScope} 
                  onChange={(e) => setRoleScope(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="organization">
                    <BankOutlined /> Organização
                  </Radio.Button>
                  <Radio.Button value="client">
                    <ShopOutlined /> Cliente Específico
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Divider />
            </>
          )}

          {/* Cliente (se escopo = client) */}
          {roleScope === 'client' && (
            <Form.Item
              name="clientId"
              label="Cliente"
              rules={[{ required: true, message: 'Selecione o cliente' }]}
            >
              <Select 
                placeholder="Selecione o cliente"
                showSearch
                optionFilterProp="children"
              >
                {clients.map(client => (
                  <Option key={client.id} value={client.id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Nome Técnico"
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { pattern: /^[a-z0-9-]+$/, message: 'Apenas letras minúsculas, números e hífens' }
            ]}
          >
            <Input placeholder="suporte-nivel-1" disabled={!!selectedRole} />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Nome de Exibição"
            rules={[{ required: true, message: 'Nome de exibição é obrigatório' }]}
          >
            <Input placeholder="Suporte Nível 1" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <Input.TextArea rows={3} placeholder="Descrição do role..." />
          </Form.Item>

          <Form.Item
            name="level"
            label="Nível"
            rules={[{ required: true, message: 'Nível é obrigatório' }]}
          >
            <Select placeholder="Selecione o nível">
              <Option value="organization">Organização</Option>
              <Option value="client">Cliente</Option>
              <Option value="user">Utilizador</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Prioridade"
            rules={[{ required: true, message: 'Prioridade é obrigatória' }]}
            tooltip="100-999"
          >
            <Input type="number" min={100} max={999} placeholder="500" />
          </Form.Item>

          <Form.Item name="permissions" label="Permissões">
            <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #d9d9d9', padding: '12px' }}>
              <Collapse accordion>
                {Object.keys(groupedPermissions).map(category => (
                  <Panel header={`${category} (${groupedPermissions[category].length})`} key={category}>
                    <Form.Item name="permissions" noStyle>
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {groupedPermissions[category].map(perm => (
                            <Checkbox key={perm.id} value={perm.id}>
                              <Space>
                                <Text strong>{perm.resource}</Text>
                                <Text code>{perm.action}</Text>
                                {perm.displayName && (
                                  <Text type="secondary">{perm.displayName}</Text>
                                )}
                              </Space>
                            </Checkbox>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                  </Panel>
                ))}
              </Collapse>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        title={`Role: ${selectedRole?.displayName}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Fechar
          </Button>
        ]}
        width={700}
      >
        {selectedRole && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Nome Técnico" span={2}>
                <Text code>{selectedRole.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Escopo" span={2}>
                {getScopeTag(selectedRole.scope)}
                {selectedRole.clientId && (
                  <Text style={{ marginLeft: 8 }}>
                    {getClientName(selectedRole.clientId)}
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nível">
                {getLevelTag(selectedRole.level)}
              </Descriptions.Item>
              <Descriptions.Item label="Prioridade">
                <Tag color={selectedRole.priority >= 800 ? 'red' : 'default'}>
                  {selectedRole.priority}
                </Tag>
              </Descriptions.Item>
              {selectedRole.description && (
                <Descriptions.Item label="Descrição" span={2}>
                  {selectedRole.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <Title level={5}>Permissões ({selectedRole.permissions?.length || 0})</Title>
              <Collapse>
                {Object.keys(groupedPermissions).map(category => {
                  const categoryPerms = selectedRole.permissions?.filter(p => p.category === category);
                  if (!categoryPerms || categoryPerms.length === 0) return null;

                  return (
                    <Panel header={`${category} (${categoryPerms.length})`} key={category}>
                      <Space direction="vertical">
                        {categoryPerms.map(perm => (
                          <div key={perm.id}>
                            <Text strong>{perm.resource}</Text>.
                            <Text code>{perm.action}</Text>
                            <Tag color="blue" style={{ marginLeft: 8 }}>{perm.scope}</Tag>
                          </div>
                        ))}
                      </Space>
                    </Panel>
                  );
                })}
              </Collapse>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default RoleManagement;
