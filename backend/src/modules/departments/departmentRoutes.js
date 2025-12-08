import express from 'express';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departmentController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, schemas } from '../../middleware/validate.js';
import { auditLog } from '../../middleware/audit.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post(
  '/',
  authorize('org-admin'),
  validate(schemas.createDepartment),
  auditLog('create', 'department'),
  createDepartment
);
router.put(
  '/:id',
  authorize('org-admin'),
  validate(schemas.updateDepartment),
  auditLog('update', 'department'),
  updateDepartment
);
router.delete(
  '/:id',
  authorize('org-admin'),
  auditLog('delete', 'department'),
  deleteDepartment
);

export default router;
