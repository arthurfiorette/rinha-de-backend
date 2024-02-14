import type http from 'http';
import { credit, debit } from '../repository.js';
import { TransacaoBody } from '../schemas/index.js';
import type { ITransacaoBody, RouteContext } from '../schemas/types.js';
import { parseRequestBody } from '../server/parse-body.js';
import { error } from '../util/log.js';

export function getTransacoes(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  params: { clientId?: string },
  store: RouteContext
) {
  const clientId = Number(params.clientId);

  // As we don't have a way of creating new clients, if a client
  // isn't present in the cache, it means it doesn't exist or is NaN
  if (!store.limit_cache[clientId]) {
    response.statusCode = 404;
    response.end(`Client with ID ${clientId} not found`);
    return;
  }

  return parseRequestBody(
    request,
    TransacaoBody,
    async (err: string | null, body?: ITransacaoBody) => {
      try {
        if (err !== null || !body) {
          response.statusCode = 400;
          response.end(err);
          return;
        }

        const [transaction] =
          body.tipo === 'c'
            ? await credit(store.sql, clientId, body.valor, body.descricao)
            : await debit(store.sql, clientId, body.valor, body.descricao);

        if (transaction.error) {
          response.statusCode = 422;
          response.end(transaction.message);
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');

        response.end(
          JSON.stringify({
            limite: store.limit_cache[clientId],
            saldo: transaction.new_balance
          })
        );
      } catch (err) {
        error('Server error:', err);
        response.statusCode = 500;
        response.end('Internal server error');
      }
    }
  );
}
