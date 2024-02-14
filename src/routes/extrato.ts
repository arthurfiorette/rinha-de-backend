import type http from 'http';
import { ExtratoReply } from '../schemas/index.js';
import { error } from '../util/log.js';
import type { RouteContext } from '../schemas/types.js';
import { selectClientBalance } from '../repository.js';

export async function getExtrato(
  _request: http.IncomingMessage,
  response: http.ServerResponse,
  params: { clientId?: string },
  store: RouteContext
) {
  try {
    const clientId = Number(params.clientId);

    // As we don't have a way of creating new clients, if a client
    // isn't present in the cache, it means it doesn't exist or is NaN
    if (!store.limit_cache[clientId]) {
      response.statusCode = 404;
      response.end(`Client with ID ${clientId} not found`);
      return;
    }

    const [result] = await selectClientBalance(store.sql, clientId);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');

    response.end(
      ExtratoReply({
        saldo: {
          total: result.balance,
          data_extrato: new Date().toISOString(),
          limite: store.limit_cache[clientId]
        },
        ultimas_transacoes: result.transactions
      })
    );
  } catch (err) {
    error('Server error:', err);
    response.statusCode = 500;
    response.end('Internal server error');
  }
}
