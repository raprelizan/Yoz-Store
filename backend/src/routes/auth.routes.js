const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/register', validate(Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
})), asyncHandler(ctrl.register));

router.post('/login', validate(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})), asyncHandler(ctrl.login));

router.get('/me', auth, asyncHandler(ctrl.me));

module.exports = router;
