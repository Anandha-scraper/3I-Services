const NodeCache = require('node-cache');
const ms = require('ms');

const expiresInStr = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_TTL = Math.floor(ms(expiresInStr) / 1000); // convert to seconds for node-cache

const cache = new NodeCache({ stdTTL: SESSION_TTL, checkperiod: 600 });

const setSession = (userId, token) => cache.set(`session:${userId}`, token, SESSION_TTL);
const getSession = (userId) => cache.get(`session:${userId}`);
const deleteSession = (userId) => cache.del(`session:${userId}`);

module.exports = { setSession, getSession, deleteSession };
