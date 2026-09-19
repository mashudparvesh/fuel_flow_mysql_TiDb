// Vercel Serverless Function entrypoint
const fs = require('fs');
const path = require('path');

let appHandler = null;

module.exports = (req, res) => {
  if (!appHandler) {
    try {
      const bundledPath = path.join(process.cwd(), 'dist', 'server.cjs');
      const rootPath = path.join(process.cwd(), 'server.cjs');

      let serverModule;
      if (fs.existsSync(bundledPath)) {
        serverModule = require(bundledPath);
      } else if (fs.existsSync(rootPath)) {
        serverModule = require(rootPath);
      } else {
        res.status(500).json({ error: 'FuelNest backend server bundle not found' });
        return;
      }
      appHandler = serverModule.app || serverModule.default || serverModule;
    } catch (err) {
      console.error('[Vercel Serverless] Failed to load server:', err);
      res.status(500).json({ error: 'Failed to initialize server', message: err?.message });
      return;
    }
  }

  return appHandler(req, res);
};
