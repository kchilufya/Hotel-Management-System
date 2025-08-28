// Generate JWT Secret
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('🔐 Your JWT Secret for Render:');
console.log(jwtSecret);
console.log('');
console.log('📋 Copy this secret - you\'ll need it for Render deployment!');
