const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/auth.controller');

router.post('/register', validate(Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() })), ctrl.register);
router.post('/login', validate(Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })), ctrl.login);

module.exports = router;
