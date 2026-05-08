require('dotenv').config();
const app = require('./app');
const connect = require('./config/db');
const User = require('./models/User');
const SystemSetting = require('./models/SystemSetting');
const bcrypt = require('bcryptjs');
const logger = require('./config/logger');

async function seedDefaults() {
  if (!(await SystemSetting.findOne())) {
    await SystemSetting.create({
      apiKey: process.env.ONECLICK_API_KEY || 'replace_with_key',
      baseUrl: process.env.ONECLICK_BASE_URL || 'https://api.oneclickdz.com',
      serviceEnabled: process.env.SERVICE_ENABLED !== 'false',
      pricingMode: Number(process.env.DEFAULT_FIXED_FEE || 0) > 0 ? 'fixed' : 'percent',
      markupPercent: Number(process.env.DEFAULT_MARKUP_PERCENT || 10),
      fixedFee: Number(process.env.DEFAULT_FIXED_FEE || 0)
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yoz.local';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12),
      role: 'admin',
      balance: 0
    });
  }
}

(async () => {
  await connect();
  await seedDefaults();
  const port = process.env.PORT || 5000;
  app.listen(port, () => logger.info(`Server started on port ${port}`));
})();
