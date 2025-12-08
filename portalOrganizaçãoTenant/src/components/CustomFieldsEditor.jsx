import { useState } from 'react';
import { Plus, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { confirmDelete } from '../utils/alerts';

const CustomFieldsEditor = ({ fields, onChange }) => {
  const [expandedField, setExpandedField] = useState(null);

  const fieldTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'textarea', label: 'Área de Texto' },
    { value: 'number', label: 'Número' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Data' },
    { value: 'time', label: 'Hora' },
    { value: 'datetime', label: 'Data e Hora' },
    { value: 'dropdown', label: 'Lista Suspensa' },
    { value: 'radio', label: 'Botões de Opção' },
    { value: 'checkbox', label: 'Caixas de Seleção' },
    { value: 'multiselect', label: 'Seleção Múltipla' },
    { value: 'file', label: 'Arquivo' },
    { value: 'currency', label: 'Moeda' },
    { value: 'rating', label: 'Avaliação' },
    { value: 'slider', label: 'Controle Deslizante' },
    { value: 'color', label: 'Cor' }
  ];

  const addField = () => {
    const newField = {
      name: `field_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: false,
      placeholder: '',
      helpText: '',
      options: [],
      validation: {}
    };
    onChange([...fields, newField]);
    setExpandedField(fields.length);
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeField = async (index) => {
    const confirmed = await confirmDelete(
      'Remover campo?',
      'Deseja realmente remover este campo?'
    )
    if (confirmed) {
      onChange(fields.filter((_, i) => i !== index));
    }
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  const needsOptions = (type) => ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Campos Customizados</h4>
        <button
          type="button"
          onClick={addField}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar Campo
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          Nenhum campo customizado. Clique em "Adicionar Campo" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedField(expandedField === index ? null : index)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {expandedField === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <span className="font-medium">{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                  <span className="text-xs text-gray-500">({field.type})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedField === index && (
                <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nome do Campo</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Rótulo</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Tipo de Campo</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                      >
                        {fieldTypes.map((ft) => (
                          <option key={ft.value} value={ft.value}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                        />
                        <span className="text-sm">Campo Obrigatório</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Texto de Ajuda</label>
                    <input
                      type="text"
                      value={field.helpText || ''}
                      onChange={(e) => updateField(index, { helpText: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                    />
                  </div>

                  {needsOptions(field.type) && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Opções (uma por linha)
                      </label>
                      <textarea
                        value={(field.options || []).join('\n')}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter(o => o.trim());
                          updateField(index, { options });
                        }}
                        rows={4}
                        className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      />
                    </div>
                  )}

                  {/* Validações */}
                  {(field.type === 'text' || field.type === 'textarea') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Min. Caracteres</label>
                        <input
                          type="number"
                          value={field.minLength || ''}
                          onChange={(e) => updateField(index, { minLength: parseInt(e.target.value) })}
                          className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Max. Caracteres</label>
                        <input
                          type="number"
                          value={field.maxLength || ''}
                          onChange={(e) => updateField(index, { maxLength: parseInt(e.target.value) })}
                          className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  )}

                  {field.type === 'number' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Valor Mínimo</label>
                        <input
                          type="number"
                          value={field.min || ''}
                          onChange={(e) => updateField(index, { min: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Valor Máximo</label>
                        <input
                          type="number"
                          value={field.max || ''}
                          onChange={(e) => updateField(index, { max: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomFieldsEditor;
