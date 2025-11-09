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
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CrownOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  SafetyOutlined,
  UserOutlined
} from '@ant-design/icons';
import rbacService from '../../services/rbacService';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

/**
 * Página de Gestão de Roles - Portal BackOffice
 * Admin-org pode ver e gerir TODOS os roles do sistema
 */
const RoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadStatistics();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rbacService.getRoles();
      setRoles(response.roles);
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

  const loadStatistics = async () => {
    try {
      const response = await rbacService.getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    if (role.isSystem) {
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
    if (role.isSystem) {
      message.warning('Não pode eliminar roles do sistema');
      return;
    }

    Modal.confirm({
      title: 'Eliminar Role',
      content: `Tem certeza que deseja eliminar o role "${role.displayName}"? Esta ação não pode ser revertida.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await rbacService.deleteRole(role.id);
          message.success('Role eliminado com sucesso');
          loadRoles();
          loadStatistics();
        } catch (error) {
          message.error(error.response?.data?.error || 'Erro ao eliminar role');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (selectedRole) {
        await rbacService.updateRole(selectedRole.id, values);
        message.success('Role atualizado com sucesso');
      } else {
        await rbacService.createRole(values);
        message.success('Role criado com sucesso');
      }
      setModalVisible(false);
      form.resetFields();
      loadRoles();
      loadStatistics();
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
          {record.isSystem ? (
            <Tooltip title="Role do Sistema (Global)">
              <LockOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          ) : (
            <Tooltip title={record.organizationId ? 'Role Customizado (Organização)' : 'Role Customizado'}>
              <UnlockOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          <strong>{text}</strong>
        </Space>
      ),
      filters: [
        { text: 'Roles do Sistema', value: 'system' },
        { text: 'Roles Customizados', value: 'custom' }
      ],
      onFilter: (value, record) => 
        value === 'system' ? record.isSystem : !record.isSystem
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
      render: (level) => getLevelTag(level),
      filters: [
        { text: 'Organização', value: 'organization' },
        { text: 'Cliente', value: 'client' },
        { text: 'Utilizador', value: 'user' }
      ],
      onFilter: (value, record) => record.level === value
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
      sorter: (a, b) => a.permissionCount - b.permissionCount,
      render: (count) => (
        <Tag color="blue">{count} permissões</Tag>
      )
    },
    {
      title: 'Escopo',
      key: 'scope',
      render: (_, record) => (
        record.organizationId ? (
          <Tag color="cyan">Organização Específica</Tag>
        ) : (
          <Tag color="purple">Global</Tag>
        )
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
          
          {!record.isSystem && (
            <>
              <Tooltip title="Editar">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              
              <Tooltip title="Eliminar">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Estatísticas */}
        {statistics && (
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total de Roles"
                  value={statistics.totalRoles}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Roles do Sistema"
                  value={statistics.systemRoles}
                  prefix={<SafetyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Roles Customizados"
                  value={statistics.customRoles}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Permissões"
                  value={statistics.totalPermissions}
                  prefix={<LockOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Main Card */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={3}>
                  <CrownOutlined /> Gestão Global de Roles
                </Title>
                <Text type="secondary">
                  Como administrador, pode ver e gerir todos os roles do sistema
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
              message="Administrador Total"
              description="Tens acesso completo a todos os roles (sistema e customizados) de todas as organizações. Roles do sistema (com cadeado) não podem ser editados ou eliminados."
              type="success"
              showIcon
              icon={<CrownOutlined />}
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
      </Space>

      {/* Modal de Criar/Editar */}
      <Modal
        title={selectedRole ? 'Editar Role' : 'Criar Role Customizado'}
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
          <Row gutter={16}>
            <Col span={12}>
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
            </Col>

            <Col span={12}>
              <Form.Item
                name="displayName"
                label="Nome de Exibição"
                rules={[{ required: true, message: 'Nome de exibição é obrigatório' }]}
              >
                <Input placeholder="Suporte Nível 1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Descrição"
          >
            <Input.TextArea rows={3} placeholder="Descrição detalhada do role..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="level"
                label="Nível Hierárquico"
                rules={[{ required: true, message: 'Nível é obrigatório' }]}
                tooltip="Define o escopo de acesso do role"
              >
                <Select placeholder="Selecione o nível">
                  <Option value="organization">Organização</Option>
                  <Option value="client">Cliente</Option>
                  <Option value="user">Utilizador</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="priority"
                label="Prioridade"
                rules={[{ required: true, message: 'Prioridade é obrigatória' }]}
                tooltip="Quanto maior, mais privilégios. Sistema: 600-1000, Custom: 100-599"
              >
                <Input 
                  type="number" 
                  min={100} 
                  max={999} 
                  placeholder="500"
                  addonAfter={
                    <span style={{ fontSize: '12px' }}>
                      100-599
                    </span>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="permissions"
            label="Permissões"
            tooltip="Selecione todas as permissões que este role deve ter"
          >
            <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '12px' }}>
              <Collapse accordion>
                {Object.keys(groupedPermissions).map(category => (
                  <Panel 
                    header={
                      <Space>
                        <Text strong>{category}</Text>
                        <Tag color="blue">{groupedPermissions[category].length}</Tag>
                      </Space>
                    } 
                    key={category}
                  >
                    <Form.Item name="permissions" noStyle>
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {groupedPermissions[category].map(perm => (
                            <Checkbox key={perm.id} value={perm.id}>
                              <Space>
                                <Text strong>{perm.resource}</Text>
                                <Text code>{perm.action}</Text>
                                <Tag color="cyan" style={{ fontSize: '11px' }}>{perm.scope}</Tag>
                                {perm.displayName && (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {perm.displayName}
                                  </Text>
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
        title={
          <Space>
            {selectedRole?.isSystem ? <LockOutlined /> : <UnlockOutlined />}
            {selectedRole?.displayName}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Fechar
          </Button>
        ]}
        width={800}
      >
        {selectedRole && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Nome Técnico" span={2}>
                <Text code>{selectedRole.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Nome de Exibição" span={2}>
                <Text strong>{selectedRole.displayName}</Text>
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
                  <Tag color="orange" icon={<LockOutlined />}>
                    Role do Sistema (Global)
                  </Tag>
                ) : (
                  <Tag color="green" icon={<UnlockOutlined />}>
                    Role Customizado
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Escopo" span={2}>
                {selectedRole.organizationId ? (
                  <Tag color="cyan">Organização Específica</Tag>
                ) : (
                  <Tag color="purple">Global</Tag>
                )}
              </Descriptions.Item>
              {selectedRole.description && (
                <Descriptions.Item label="Descrição" span={2}>
                  {selectedRole.description}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Pode Editar" span={1}>
                {selectedRole.canEdit ? (
                  <Tag color="success">Sim</Tag>
                ) : (
                  <Tag color="default">Não</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Pode Eliminar" span={1}>
                {selectedRole.canDelete ? (
                  <Tag color="success">Sim</Tag>
                ) : (
                  <Tag color="default">Não</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Title level={5}>
                Permissões ({selectedRole.permissions?.length || 0})
              </Title>
              <Collapse>
                {Object.keys(groupedPermissions).map(category => {
                  const categoryPerms = selectedRole.permissions?.filter(p => p.category === category);
                  if (!categoryPerms || categoryPerms.length === 0) return null;

                  return (
                    <Panel 
                      header={
                        <Space>
                          <Text strong>{category}</Text>
                          <Tag color="blue">{categoryPerms.length}</Tag>
                        </Space>
                      } 
                      key={category}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {categoryPerms.map(perm => (
                          <div key={perm.id} style={{ padding: '4px 0' }}>
                            <Space>
                              <Text strong>{perm.resource}</Text>
                              <Text code>{perm.action}</Text>
                              <Tag color="blue">{perm.scope}</Tag>
                              {perm.displayName && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {perm.displayName}
                                </Text>
                              )}
                            </Space>
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
