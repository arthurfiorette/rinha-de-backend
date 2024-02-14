import http from 'http';
import findMyWay from 'find-my-way';
import { createPostgresInstance } from '../repository.js';
import { getExtrato } from '../routes/extrato.js';
import { getTransacoes } from '../routes/transacoes.js';
import type { DbClient, RouteContext } from '../schemas/types.js';
import { Env } from '../util/env.js';
import { error, log } from '../util/log.js';

export async function createServer() {
  const router = findMyWay({
    onBadUrl(_path, _req, res) {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  const context: RouteContext = {
    sql: createPostgresInstance(Env.POSTGRES_URL),
    limit_cache: {}
  };

  await context.sql<Pick<DbClient, 'id' | 'limit'>[]>`SELECT * FROM client`.forEach((user) => {
    context.limit_cache[user.id] = user.limit;
    log(`Cached limit for user ${user.id}: ${user.limit}`);
  });

  router.post('/clientes/:clientId/transacoes', getTransacoes, context);
  router.get('/clientes/:clientId/extrato', getExtrato, context);

  const server = http.createServer(router.lookup.bind(router));

  server.on('error', (err) => {
    error('Server error:', err);
  });

  server.on('listening', () => {
    log('Server listening!', server.address());
  });

  return server;
}
