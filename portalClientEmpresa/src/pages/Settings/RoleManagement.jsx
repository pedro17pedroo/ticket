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
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CrownOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import rbacService from '../../services/rbacService';
import { usePermissions } from '../../hooks/usePermissions';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

/**
 * Página de Gestão de Roles
 * Permite criar, editar e visualizar roles customizados
 */
const RoleManagement = () => {
  const { isAdmin, isClientAdmin, user } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [canCreateCustomRole, setCanCreateCustomRole] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rbacService.getRoles();
      setRoles(response.roles);
      setCanCreateCustomRole(response.canCreateCustomRole);
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
      setPermissions(response.permissions);
      setGroupedPermissions(response.grouped);
    } catch (error) {
      message.error('Erro ao carregar permissões');
      console.error(error);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    if (!role.canEdit) {
      message.warning('Não pode editar roles do sistema');
      return;
    }
    setSelectedRole(role);
    form.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      level: role.level,
      priority: role.priority,
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
      message.warning('Não pode eliminar roles do sistema');
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
      if (selectedRole) {
        // Editar
        await rbacService.updateRole(selectedRole.id, values);
        message.success('Role atualizado com sucesso');
      } else {
        // Criar
        await rbacService.createRole(values);
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

  const columns = [
    {
      title: 'Role',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <Space>
          {record.isSystem && (
            <Tooltip title="Role do Sistema">
              <LockOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
          {!record.isSystem && (
            <Tooltip title="Role Customizado">
              <UnlockOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: 'Nome Técnico',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text code>{text}</Text>
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
                Gerir roles e permissões da organização
              </Text>
            </div>
            {canCreateCustomRole && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Criar Role Customizado
              </Button>
            )}
          </div>

          {/* Info Alert */}
          {isClientAdmin && (
            <Alert
              message="Gestão de Roles"
              description="Pode criar roles customizados para a sua organização. Roles do sistema (com cadeado) não podem ser editados."
              type="info"
              showIcon
            />
          )}

          {isAdmin && (
            <Alert
              message="Administrador"
              description="Como administrador, pode ver e gerir todos os roles do sistema."
              type="success"
              showIcon
            />
          )}

          {/* Table */}
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} roles`
            }}
          />
        </Space>
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={selectedRole ? 'Editar Role' : 'Criar Role Customizado'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Nome Técnico"
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { pattern: /^[a-z0-9-]+$/, message: 'Apenas letras minúsculas, números e hífens' }
            ]}
            tooltip="Nome único para o role (ex: suporte-nivel-1)"
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

          <Form.Item
            name="description"
            label="Descrição"
          >
            <Input.TextArea rows={3} placeholder="Descrição do role..." />
          </Form.Item>

          <Form.Item
            name="level"
            label="Nível"
            rules={[{ required: true, message: 'Nível é obrigatório' }]}
            tooltip="Nível hierárquico do role"
          >
            <Select placeholder="Selecione o nível">
              {isAdmin && <Option value="organization">Organização</Option>}
              <Option value="client">Cliente</Option>
              <Option value="user">Utilizador</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Prioridade"
            rules={[{ required: true, message: 'Prioridade é obrigatória' }]}
            tooltip="Quanto maior, mais privilégios (100-999)"
          >
            <Input type="number" min={100} max={999} placeholder="500" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissões"
            tooltip="Selecione as permissões deste role"
          >
            <Collapse>
              {Object.keys(groupedPermissions).map(category => (
                <Panel header={category} key={category}>
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {groupedPermissions[category].map(perm => (
                        <Checkbox key={perm.id} value={perm.id}>
                          <Text strong>{perm.resource}</Text>.
                          <Text code>{perm.action}</Text>
                          {perm.displayName && (
                            <Text type="secondary"> - {perm.displayName}</Text>
                          )}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Panel>
              ))}
            </Collapse>
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
              <Descriptions.Item label="Nome de Exibição" span={2}>
                {selectedRole.displayName}
              </Descriptions.Item>
              <Descriptions.Item label="Nível">
                {getLevelTag(selectedRole.level)}
              </Descriptions.Item>
              <Descriptions.Item label="Prioridade">
                <Tag color={selectedRole.priority >= 800 ? 'red' : 'default'}>
                  {selectedRole.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo" span={2}>
                {selectedRole.isSystem ? (
                  <Tag color="orange">
                    <LockOutlined /> Role do Sistema
                  </Tag>
                ) : (
                  <Tag color="green">
                    <UnlockOutlined /> Role Customizado
                  </Tag>
                )}
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
