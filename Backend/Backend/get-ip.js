// get-ip.js
const dns = require('dns');
dns.lookup('api-inference.huggingface.co', { family: 4 }, (err, address) => {
  if (err) console.error('Error:', err.message);
  else console.log('✅ IP Address:', address);
});