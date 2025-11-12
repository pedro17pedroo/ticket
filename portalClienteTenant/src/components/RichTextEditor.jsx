import { useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
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
  // Configuração da toolbar
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-gray-800"
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .dark .rich-text-editor .ql-toolbar {
          background: #374151;
          border-color: #4b5563;
        }

        .rich-text-editor .ql-container {
          border: 1px solid #d1d5db;
          border-radius: 0 0 0.5rem 0.5rem;
          font-size: 14px;
          min-height: 150px;
        }

        .dark .rich-text-editor .ql-container {
          border-color: #4b5563;
          background: #1f2937;
          color: #f3f4f6;
        }

        .rich-text-editor .ql-editor {
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
        }

        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
        }

        .dark .rich-text-editor .ql-stroke {
          stroke: #9ca3af;
        }

        .dark .rich-text-editor .ql-fill {
          fill: #9ca3af;
        }

        .dark .rich-text-editor .ql-picker-label {
          color: #9ca3af;
        }

        /* Estilo para visualização */
        .ticket-description-view {
          line-height: 1.6;
        }

        .ticket-description-view h1,
        .ticket-description-view h2,
        .ticket-description-view h3 {
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }

        .ticket-description-view h1 { font-size: 1.5em; }
        .ticket-description-view h2 { font-size: 1.3em; }
        .ticket-description-view h3 { font-size: 1.1em; }

        .ticket-description-view ul,
        .ticket-description-view ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ticket-description-view a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .dark .ticket-description-view a {
          color: #60a5fa;
        }

        .ticket-description-view strong {
          font-weight: 600;
        }

        .ticket-description-view em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
