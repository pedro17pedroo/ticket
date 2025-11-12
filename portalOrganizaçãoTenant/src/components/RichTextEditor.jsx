import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// Suprimir warnings globalmente ANTES do componente renderizar
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
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
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('non-boolean attribute') ||
       args[0].includes('findDOMNode'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
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
    <div className={`rich-text-editor-wrapper ${className}`}>
      <div className="rich-text-editor">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white dark:bg-gray-800"
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
