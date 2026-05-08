const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { auth, adminOnly } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/admin.controller');

router.use(auth, adminOnly);

router.get('/settings', asyncHandler(ctrl.getSettings));
router.put('/settings', validate(Joi.object({
  apiKey: Joi.string().min(8).optional(),
  baseUrl: Joi.string().uri().optional(),
  serviceEnabled: Joi.boolean().optional(),
  pricingMode: Joi.string().valid('percent', 'fixed').optional(),
  markupPercent: Joi.number().min(0).max(100).optional(),
  fixedFee: Joi.number().min(0).optional()
}).min(1)), asyncHandler(ctrl.updateSettings));
router.get('/validate-api', asyncHandler(ctrl.verifyApi));
router.get('/users', asyncHandler(ctrl.users));
router.patch('/users/:id', validate(Joi.object({
  balance: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
}).min(1)), asyncHandler(ctrl.updateUser));

module.exports = router;
