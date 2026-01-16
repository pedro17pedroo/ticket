import { useState, useEffect } from 'react';
import { ArrowRightLeft, X, ChevronRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TransferTicketModal = ({ ticketId, currentData, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    directionId: currentData?.directionId || '',
    departmentId: currentData?.departmentId || '',
    sectionId: currentData?.sectionId || '',
    assigneeId: currentData?.assigneeId || '',
    categoryId: currentData?.categoryId || '',
    type: currentData?.type || '',
    reason: ''
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      // Carregar em batches para evitar rate limiting
      const [dirsRes, deptsRes, secsRes] = await Promise.all([
        api.get('/directions'),
        api.get('/departments'),
        api.get('/sections')
      ]);

      setDirections(dirsRes.data.directions || []);
      setAllDepartments(deptsRes.data.departments || []);
      setAllSections(secsRes.data.sections || []);

      // Segunda batch
      const [catsRes, usersRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/users')
      ]);

      setCategories(catsRes.data.categories || []);
      setUsers(usersRes.data.users?.filter(u => u.role === 'org-admin' || u.role === 'agent') || []);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
      toast.error('Erro ao carregar opções');
    }
  };

  // Filtrar departamentos pela direção selecionada
  const filteredDepartments = formData.directionId
    ? allDepartments.filter(dept => dept.directionId === formData.directionId)
    : allDepartments;

  // Filtrar seções pelo departamento selecionado
  const filteredSections = formData.departmentId
    ? allSections.filter(sec => sec.departmentId === formData.departmentId)
    : allSections;

  // Handler para mudança de direção
  const handleDirectionChange = (directionId) => {
    setFormData({
      ...formData,
      directionId,
      departmentId: '', // Limpar departamento
      sectionId: '' // Limpar seção
    });
  };

  // Handler para mudança de departamento
  const handleDepartmentChange = (departmentId) => {
    setFormData({
      ...formData,
      departmentId,
      sectionId: '' // Limpar seção
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error('Por favor, informe o motivo da transferência');
      return;
    }

    setLoading(true);
    try {
      // Limpar strings vazias (converter para undefined)
      const payload = {
        directionId: formData.directionId || undefined,
        departmentId: formData.departmentId || undefined,
        sectionId: formData.sectionId || undefined,
        assigneeId: formData.assigneeId || undefined,
        categoryId: formData.categoryId || undefined,
        type: formData.type || undefined,
        reason: formData.reason.trim()
      };

      await api.post(`/tickets/${ticketId}/transfer`, payload);
      toast.success('Ticket transferido com sucesso');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao transferir ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Transferir Ticket</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enviar para outra área ou reatribuir responsável
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info Alert */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Filtros Cascata:</strong> Ao selecionar uma direção, apenas os departamentos dessa direção
              serão exibidos. Da mesma forma, ao selecionar um departamento, apenas as secções desse departamento
              aparecerão.
            </p>
          </div>

          {/* Breadcrumb de Seleção */}
          {(formData.directionId || formData.departmentId || formData.sectionId) && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Caminho Selecionado:</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                {formData.directionId && (
                  <>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {directions.find(d => d.id === formData.directionId)?.name || 'Direção'}
                    </span>
                    {formData.departmentId && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </>
                )}
                {formData.departmentId && (
                  <>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {allDepartments.find(d => d.id === formData.departmentId)?.name || 'Departamento'}
                    </span>
                    {formData.sectionId && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </>
                )}
                {formData.sectionId && (
                  <span className="font-medium text-primary-600 dark:text-primary-400">
                    {allSections.find(s => s.id === formData.sectionId)?.name || 'Secção'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Direction */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Direção
                <span className="text-xs text-gray-500 ml-2">({directions.length} disponíveis)</span>
              </label>
              <select
                value={formData.directionId}
                onChange={(e) => handleDirectionChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Selecione...</option>
                {directions.map((dir) => (
                  <option key={dir.id} value={dir.id}>{dir.name}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Departamento
                <span className="text-xs text-gray-500 ml-2">
                  ({filteredDepartments.length} disponíveis{formData.directionId ? ' nesta direção' : ''})
                </span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={!formData.directionId && filteredDepartments.length === 0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.directionId ? 'Selecione...' : 'Selecione uma direção primeiro'}
                </option>
                {filteredDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Secção
                <span className="text-xs text-gray-500 ml-2">
                  ({filteredSections.length} disponíveis{formData.departmentId ? ' neste departamento' : ''})
                </span>
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                disabled={!formData.departmentId && filteredSections.length === 0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.departmentId ? 'Selecione...' : 'Selecione um departamento primeiro'}
                </option>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium mb-2">Responsável</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Não atribuído</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Manter tipo atual</option>
                <option value="incidente">Incidente</option>
                <option value="requisição">Requisição</option>
                <option value="problema">Problema</option>
                <option value="mudança">Mudança</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Motivo da Transferência <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                required
                placeholder="Descreva o motivo da transferência..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Transferindo...'
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferTicketModal;
