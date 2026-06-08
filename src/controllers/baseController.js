const { ok } = require('../utils/response');

function getHealth(req, res) {
  return ok(res, { service: 'node_express' }, 'Service is healthy');
}

function getWelcome(req, res) {
  return ok(res, { name: 'Express backend' }, 'Welcome to Express backend');
}

module.exports = {
  getHealth,
  getWelcome,
};
