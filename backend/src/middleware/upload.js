import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && allowedTypes.test(ext)) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20971520 // 20MB padrão
  }
});

// Middleware para upload único
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware para múltiplos uploads
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
