const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { auth, adminOnly } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/transaction.controller');

const topupSchema = Joi.object({
  type: Joi.string().valid('mobile', 'internet').required(),
  plan_code: Joi.when('type', { is: 'mobile', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  MSSIDN: Joi.when('type', { is: 'mobile', then: Joi.string().pattern(/^0[567][0-9]{8}$/).required(), otherwise: Joi.forbidden() }),
  amount: Joi.when('type', { is: 'mobile', then: Joi.number().integer().positive().required(), otherwise: Joi.forbidden() }),
  internetType: Joi.when('type', { is: 'internet', then: Joi.string().valid('ADSL', '4G').default('ADSL'), otherwise: Joi.forbidden() }),
  number: Joi.when('type', { is: 'internet', then: Joi.string().min(6).max(30).required(), otherwise: Joi.forbidden() }),
  value: Joi.when('type', { is: 'internet', then: Joi.number().integer().positive().required(), otherwise: Joi.forbidden() }),
  ref: Joi.string().max(100).optional()
});

const filterSchema = Joi.object({
  userId: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('PENDING', 'HANDLING', 'FULFILLED', 'REFUNDED', 'FAILED', 'UNKNOWN_ERROR').optional(),
  type: Joi.string().valid('mobile', 'internet').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional()
});

router.post('/topup', auth, validate(topupSchema), asyncHandler(ctrl.createTopup));
router.get('/me', auth, asyncHandler(ctrl.myTransactions));
router.get('/admin/all', auth, adminOnly, validate(filterSchema, 'query'), asyncHandler(ctrl.allTransactions));
router.get('/admin/stats', auth, adminOnly, asyncHandler(ctrl.adminStats));
router.post('/:id/check-status', auth, asyncHandler(ctrl.checkStatus));

module.exports = router;
