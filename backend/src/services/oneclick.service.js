const axios = require('axios');
const SystemSetting = require('../models/SystemSetting');
const HttpError = require('../utils/httpError');

async function getSettings({ requireEnabled = true } = {}) {
  const settings = await SystemSetting.findOne();
  if (!settings) throw new HttpError(500, 'Provider settings are not initialized');
  if (requireEnabled && !settings.serviceEnabled) throw new HttpError(503, 'Top-up service is currently disabled');
  return settings;
}

async function client(options) {
  const settings = await getSettings(options);
  return axios.create({
    baseURL: settings.baseUrl,
    timeout: 30000,
    headers: {
      'X-Access-Token': settings.apiKey,
      'Content-Type': 'application/json'
    }
  });
}

exports.sendMobile = async (payload) => (await client()).post('/v3/mobile/send', payload).then((r) => r.data);
exports.sendInternet = async (payload) => (await client()).post('/v3/internet/send', payload).then((r) => r.data);
exports.checkMobileByRef = async (ref) => (await client()).get(`/v3/mobile/check-ref/${encodeURIComponent(ref)}`).then((r) => r.data);
exports.checkInternetByRef = async (ref) => (await client()).get(`/v3/internet/check-ref/${encodeURIComponent(ref)}`).then((r) => r.data);
exports.validateKey = async () => (await client({ requireEnabled: false })).get('/v3/validate').then((r) => r.data);
