import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// In-memory signaling store for 6-character room codes
const rooms = new Map<string, { code: string; offer: any; answer?: any; lastActive: number }>();

function roomSignalingPlugin(): Plugin {
  return {
    name: 'pool-room-signaling',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/room')) {
          return next();
        }

        // Enable full CORS for local network, mobile devices, and iframes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // Clean up rooms older than 30 minutes
        const now = Date.now();
        for (const [code, r] of rooms.entries()) {
          if (now - r.lastActive > 1800000) {
            rooms.delete(code);
          }
        }

        const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
        // urlParts: ['api', 'room', 'create'] or ['api', 'room', ':code'] or ['api', 'room', ':code', 'answer']

        if (req.method === 'POST' && urlParts[2] === 'create') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const code = (data.code || Math.random().toString(36).substring(2, 8)).toUpperCase();
              rooms.set(code, {
                code,
                offer: data.offer,
                lastActive: Date.now(),
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, code }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        const roomCode = urlParts[2]?.toUpperCase();
        if (roomCode) {
          const room = rooms.get(roomCode);

          if (req.method === 'GET') {
            if (!room) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Room not found' }));
              return;
            }
            room.lastActive = Date.now();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              code: room.code,
              offer: room.offer,
              answer: room.answer || null,
            }));
            return;
          }

          if (req.method === 'POST' && urlParts[3] === 'answer') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                if (!room) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Room not found' }));
                  return;
                }
                room.answer = data.answer;
                room.lastActive = Date.now();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), roomSignalingPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
