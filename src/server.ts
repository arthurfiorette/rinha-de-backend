import http from 'http';
import findMyWay from 'find-my-way';
import { getTransacoes } from './routes/transacoes.js';
import { getExtrato } from './routes/extrato.js';
import type { RouteContext } from './types.js';
import { Env } from './env.js';

export function createServer() {
  const router = findMyWay({
    onBadUrl(_path, _req, res) {
      res.statusCode = 404;
      res.end();
    }
  });

  const context: RouteContext = {};

  router.get('/clientes/:userId/transacoes', getTransacoes, context);
  router.get('/clientes/:userId/extrato', getExtrato, context);

  const server = http.createServer(router.lookup.bind(router));

  server.on('error', (error) => {
    console.error('Server error:', error);
  });

  server.listen(Env.PORT, () => console.log(`Server running on port ${Env.PORT}`));
}
