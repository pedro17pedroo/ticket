import { useMemo, useRef, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder = 'Escreva o conteúdo...', minHeight = '300px' }) => {
  const quillRef = useRef(null);
  
  // Suprimir warnings conhecidos do ReactQuill
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('non-boolean attribute `jsx`') ||
         args[0].includes('non-boolean attribute `global`') ||
         args[0].includes('findDOMNode is deprecated'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
  
  // Usar callback para evitar re-renders desnecessários
  const handleChange = useCallback((content) => {
    onChange(content);
  }, [onChange]);

  // Configuração dos módulos do Quill
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              // Converter para base64 para preview local
              const reader = new FileReader();
              reader.onload = (e) => {
                const quill = quillRef.current?.getEditor();
                if (quill) {
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', e.target.result);
                  quill.setSelection(range.index + 1);
                }
              };
              reader.readAsDataURL(file);
            }
          };
        }
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  // Formatos suportados
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${minHeight};
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
        }
        .dark .rich-text-editor .ql-toolbar {
          background: #374151;
          border-color: #4b5563;
        }
        .dark .rich-text-editor .ql-container {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
        }
        .dark .rich-text-editor .ql-stroke {
          stroke: #d1d5db;
        }
        .dark .rich-text-editor .ql-fill {
          fill: #d1d5db;
        }
        .dark .rich-text-editor .ql-picker {
          color: #d1d5db;
        }
        .dark .rich-text-editor .ql-picker-options {
          background: #374151;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
        .rich-text-editor .ql-editor pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .rich-text-editor .ql-editor ul, 
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5rem;
        }
        .rich-text-editor .ql-snow .ql-tooltip {
          z-index: 9999;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
