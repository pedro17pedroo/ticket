import logger from '../config/logger.js';

class CustomFieldsService {
  
  /**
   * Tipos de campos suportados
   */
  static FIELD_TYPES = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    EMAIL: 'email',
    PHONE: 'phone',
    URL: 'url',
    DATE: 'date',
    TIME: 'time',
    DATETIME: 'datetime',
    DROPDOWN: 'dropdown',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    MULTISELECT: 'multiselect',
    FILE: 'file',
    CURRENCY: 'currency',
    RATING: 'rating',
    SLIDER: 'slider',
    COLOR: 'color'
  };

  /**
   * Validadores por tipo de campo
   */
  static VALIDATORS = {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[\d\s\-\+\(\)]{8,}$/.test(value),
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    number: (value) => !isNaN(value),
    date: (value) => !isNaN(Date.parse(value))
  };

  // ===== VALIDAÇÃO DE CAMPOS =====

  /**
   * Valida dados do formulário contra definição de campos
   * @param {Array} fieldDefinitions - Definição dos campos customizados
   * @param {Object} formData - Dados preenchidos
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validateFormData(fieldDefinitions, formData) {
    const errors = [];

    for (const field of fieldDefinitions) {
      const value = formData[field.name];

      // Verificar campo obrigatório
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `O campo "${field.label}" é obrigatório`
        });
        continue;
      }

      // Se não tem valor e não é obrigatório, skip
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Validar tipo de campo
      const validationResult = this.validateFieldValue(field, value);
      if (!validationResult.valid) {
        errors.push({
          field: field.name,
          message: validationResult.message
        });
      }

      // Validar mínimo/máximo
      if (field.min !== undefined && value < field.min) {
        errors.push({
          field: field.name,
          message: `O valor deve ser no mínimo ${field.min}`
        });
      }

      if (field.max !== undefined && value > field.max) {
        errors.push({
          field: field.name,
          message: `O valor deve ser no máximo ${field.max}`
        });
      }

      // Validar minLength/maxLength para strings
      if (field.minLength && value.length < field.minLength) {
        errors.push({
          field: field.name,
          message: `O campo deve ter no mínimo ${field.minLength} caracteres`
        });
      }

      if (field.maxLength && value.length > field.maxLength) {
        errors.push({
          field: field.name,
          message: `O campo deve ter no máximo ${field.maxLength} caracteres`
        });
      }

      // Validar padrão regex
      if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: field.patternMessage || `O formato do campo "${field.label}" é inválido`
          });
        }
      }

      // Validar opções (dropdown, radio, etc)
      if (['dropdown', 'radio', 'checkbox', 'multiselect'].includes(field.type)) {
        const validOptions = field.options.map(opt => 
          typeof opt === 'string' ? opt : opt.value
        );

        if (field.type === 'multiselect' || field.type === 'checkbox') {
          // Validar array de valores
          if (!Array.isArray(value)) {
            errors.push({
              field: field.name,
              message: `O campo "${field.label}" deve ser um array`
            });
          } else {
            const invalidValues = value.filter(v => !validOptions.includes(v));
            if (invalidValues.length > 0) {
              errors.push({
                field: field.name,
                message: `Valores inválidos: ${invalidValues.join(', ')}`
              });
            }
          }
        } else {
          // Validar valor único
          if (!validOptions.includes(value)) {
            errors.push({
              field: field.name,
              message: `Valor "${value}" não é uma opção válida`
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida valor de um campo específico
   */
  validateFieldValue(field, value) {
    const { type } = field;

    // Validadores específicos
    if (CustomFieldsService.VALIDATORS[type]) {
      const isValid = CustomFieldsService.VALIDATORS[type](value);
      if (!isValid) {
        return {
          valid: false,
          message: `O valor de "${field.label}" não é um ${type} válido`
        };
      }
    }

    return { valid: true };
  }

  // ===== GERAÇÃO DE SCHEMA =====

  /**
   * Gera schema JSON para frontend renderizar formulário
   * @param {Array} fieldDefinitions - Definição dos campos
   * @returns {Object} Schema UI
   */
  generateFormSchema(fieldDefinitions) {
    return {
      fields: fieldDefinitions.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required || false,
        defaultValue: field.defaultValue,
        options: field.options,
        min: field.min,
        max: field.max,
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern,
        disabled: field.disabled || false,
        hidden: field.hidden || false,
        conditional: field.conditional, // Mostra baseado em outro campo
        validation: field.validation,
        attributes: field.attributes // Atributos HTML adicionais
      }))
    };
  }

  // ===== CAMPOS CONDICIONAIS =====

  /**
   * Avalia se campo deve ser mostrado baseado em condições
   * @param {Object} field - Definição do campo
   * @param {Object} formData - Dados atuais do formulário
   * @returns {boolean}
   */
  evaluateConditional(field, formData) {
    if (!field.conditional) {
      return true; // Sem condição, sempre mostra
    }

    const { field: condField, operator, value } = field.conditional;
    const condValue = formData[condField];

    switch (operator) {
      case 'equals':
        return condValue === value;
      case 'notEquals':
        return condValue !== value;
      case 'contains':
        return Array.isArray(condValue) && condValue.includes(value);
      case 'greaterThan':
        return condValue > value;
      case 'lessThan':
        return condValue < value;
      case 'isEmpty':
        return !condValue || condValue === '';
      case 'isNotEmpty':
        return condValue && condValue !== '';
      default:
        return true;
    }
  }

  /**
   * Filtra campos baseado em condições
   */
  getVisibleFields(fieldDefinitions, formData) {
    return fieldDefinitions.filter(field => 
      !field.hidden && this.evaluateConditional(field, formData)
    );
  }

  // ===== TRANSFORMAÇÃO DE DADOS =====

  /**
   * Transforma dados do formulário para formato de armazenamento
   * @param {Array} fieldDefinitions
   * @param {Object} formData
   * @returns {Object} Dados transformados
   */
  transformFormData(fieldDefinitions, formData) {
    const transformed = {};

    for (const field of fieldDefinitions) {
      let value = formData[field.name];

      if (value === undefined || value === null) {
        continue;
      }

      // Transformações específicas por tipo
      switch (field.type) {
        case 'number':
        case 'currency':
          transformed[field.name] = parseFloat(value);
          break;

        case 'date':
        case 'datetime':
          transformed[field.name] = new Date(value);
          break;

        case 'checkbox':
          transformed[field.name] = Array.isArray(value) ? value : [value];
          break;

        case 'multiselect':
          transformed[field.name] = Array.isArray(value) ? value : [value];
          break;

        default:
          transformed[field.name] = value;
      }
    }

    return transformed;
  }

  /**
   * Transforma dados de armazenamento para exibição
   */
  transformForDisplay(fieldDefinitions, storedData) {
    const display = {};

    for (const field of fieldDefinitions) {
      const value = storedData[field.name];

      if (value === undefined || value === null) {
        display[field.name] = field.defaultValue || '';
        continue;
      }

      // Transformações para exibição
      switch (field.type) {
        case 'date':
          display[field.name] = value instanceof Date 
            ? value.toISOString().split('T')[0]
            : value;
          break;

        case 'datetime':
          display[field.name] = value instanceof Date
            ? value.toISOString()
            : value;
          break;

        case 'currency':
          display[field.name] = parseFloat(value).toFixed(2);
          break;

        case 'dropdown':
        case 'radio':
          // Retornar label se tiver options com {value, label}
          const option = field.options?.find(opt => 
            (typeof opt === 'object' ? opt.value === value : opt === value)
          );
          display[field.name] = typeof option === 'object' ? option.label : value;
          break;

        default:
          display[field.name] = value;
      }
    }

    return display;
  }

  // ===== HELPERS =====

  /**
   * Valida definição de campo
   */
  validateFieldDefinition(field) {
    const errors = [];

    if (!field.name) {
      errors.push('Campo "name" é obrigatório');
    }

    if (!field.label) {
      errors.push('Campo "label" é obrigatório');
    }

    if (!field.type || !Object.values(CustomFieldsService.FIELD_TYPES).includes(field.type)) {
      errors.push(`Tipo de campo inválido: ${field.type}`);
    }

    if (['dropdown', 'radio', 'checkbox', 'multiselect'].includes(field.type) && !field.options) {
      errors.push(`Campo do tipo "${field.type}" requer opções`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Cria campo customizado padrão
   */
  createFieldDefinition(config) {
    return {
      name: config.name,
      label: config.label,
      type: config.type || 'text',
      placeholder: config.placeholder || '',
      helpText: config.helpText || '',
      required: config.required || false,
      defaultValue: config.defaultValue,
      options: config.options || [],
      min: config.min,
      max: config.max,
      minLength: config.minLength,
      maxLength: config.maxLength,
      pattern: config.pattern,
      patternMessage: config.patternMessage,
      disabled: config.disabled || false,
      hidden: config.hidden || false,
      conditional: config.conditional,
      validation: config.validation,
      attributes: config.attributes || {}
    };
  }

  /**
   * Exemplos de campos customizados
   */
  static getFieldExamples() {
    return {
      textField: {
        name: 'justificativa',
        label: 'Justificativa',
        type: 'textarea',
        required: true,
        minLength: 20,
        maxLength: 500,
        placeholder: 'Por favor, detalhe sua necessidade...'
      },
      dropdownField: {
        name: 'modelo',
        label: 'Modelo do Notebook',
        type: 'dropdown',
        required: true,
        options: [
          { value: 'macbook_pro_14', label: 'MacBook Pro 14"' },
          { value: 'dell_xps_15', label: 'Dell XPS 15' },
          { value: 'lenovo_thinkpad', label: 'Lenovo ThinkPad X1' }
        ]
      },
      conditionalField: {
        name: 'mac_specs',
        label: 'Especificações Mac',
        type: 'multiselect',
        options: ['Touch Bar', 'M3 Pro', 'M3 Max'],
        conditional: {
          field: 'modelo',
          operator: 'equals',
          value: 'macbook_pro_14'
        }
      }
    };
  }
}

export default new CustomFieldsService();
