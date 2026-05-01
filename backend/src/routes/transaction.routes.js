const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { auth, adminOnly } = require('../middlewares/auth');
const ctrl = require('../controllers/transaction.controller');

router.post('/topup', auth, validate(Joi.object({ type: Joi.string().valid('mobile','internet').required(), plan_code: Joi.string().when('type',{is:'mobile', then:Joi.required()}), MSSIDN: Joi.string().when('type',{is:'mobile', then:Joi.required()}), number: Joi.string().when('type',{is:'internet', then:Joi.required()}), internetType: Joi.string().optional(), amount: Joi.number().when('type',{is:'mobile', then:Joi.required()}), value: Joi.number().optional(), ref: Joi.string().optional() })), ctrl.createTopup);
router.get('/me', auth, ctrl.myTransactions);
router.get('/admin/all', auth, adminOnly, ctrl.allTransactions);

module.exports = router;
