require('dotenv').config();
const app = require('./app');
const connect = require('./config/db');
const User = require('./models/User');
const SystemSetting = require('./models/SystemSetting');
const bcrypt = require('bcryptjs');

(async () => {
  await connect();
  if (!(await SystemSetting.findOne())) {
    await SystemSetting.create({
      apiKey: process.env.ONECLICK_API_KEY,
      baseUrl: process.env.ONECLICK_BASE_URL,
      serviceEnabled: process.env.SERVICE_ENABLED === 'true',
      pricingMode: Number(process.env.DEFAULT_FIXED_FEE) > 0 ? 'fixed' : 'percent',
      markupPercent: Number(process.env.DEFAULT_MARKUP_PERCENT),
      fixedFee: Number(process.env.DEFAULT_FIXED_FEE)
    });
  }
  if (!(await User.findOne({ role: 'admin' }))) {
    await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), role: 'admin', balance: 0 });
  }
  app.listen(process.env.PORT || 5000, () => console.log('Server started'));
})();
