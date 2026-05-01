const axios = require('axios');
const SystemSetting = require('../models/SystemSetting');

async function client() {
  const settings = await SystemSetting.findOne();
  const baseURL = settings?.baseUrl || process.env.ONECLICK_BASE_URL;
  const token = settings?.apiKey || process.env.ONECLICK_API_KEY;
  return axios.create({ baseURL, headers: { 'X-Access-Token': token, 'Content-Type': 'application/json' } });
}

exports.sendMobile = async (payload) => (await client()).post('/v3/mobile/send', payload).then(r => r.data);
exports.sendInternet = async (payload) => (await client()).post('/v3/internet/send', payload).then(r => r.data);
exports.checkMobileByRef = async (ref) => (await client()).get(`/v3/mobile/check-ref/${ref}`).then(r => r.data);
exports.checkInternetByRef = async (ref) => (await client()).get(`/v3/internet/check-ref/${ref}`).then(r => r.data);
exports.validateKey = async () => (await client()).get('/v3/validate').then(r => r.data);
