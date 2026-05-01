const router = require('express').Router();
const { auth, adminOnly } = require('../middlewares/auth');
const ctrl = require('../controllers/admin.controller');

router.use(auth, adminOnly);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.get('/validate-api', ctrl.verifyApi);
router.get('/users', ctrl.users);
router.patch('/users/:id', ctrl.updateUser);

module.exports = router;
