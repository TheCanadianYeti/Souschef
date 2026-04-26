const expressApp = require('../../api/index.js');

// Disable Next.js body parsing so Express handles it
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  // Forward to Express — req.url will be something like /api/health
  return expressApp(req, res);
}
