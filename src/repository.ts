import postgres from 'postgres';
import { Env } from './util/env.js';
import { debug, log } from './util/log.js';

/**
 * Creates a new PostgreSQL connection.
 *
 * @param url The URL of the PostgreSQL database.
 * @returns A new PostgreSQL connection.
 */
export function createPostgresInstance(url: string) {
  return postgres(url, {
    onclose: () => log('Database connection closed'),
    onnotice: (msg) => log('Database notice:', msg),
    debug: Env.APP_ENV === 'prod' && debug
  });
}

/**
 * Selects the balance and transactions of a client.
 *
 * @param sql The PostgreSQL connection.
 * @param clientId The ID of the client.
 * @returns The balance and transactions of the client.
 */
export function selectClientBalance(sql: postgres.Sql, clientId: number) {
  type Result = {
    balance: number;
    transactions: {
      valor: number;
      tipo: string;
      descricao: string;
      realizada_em: Date;
    }[];
  };

  return sql<Result[]>`
    SELECT 
      client.balance,
      CASE 
          WHEN count(transaction.id) = 0 THEN '[]'::json
          ELSE json_agg(json_build_object(
              'valor', transaction.value,
              'tipo', transaction.type,
              'descricao', transaction.description,
              'realizada_em', transaction.performed_at
          ))
      END AS transactions
    FROM 
      client
    LEFT JOIN 
      transaction ON client.id = transaction.client_id
    WHERE 
      client.id = ${clientId}
    GROUP BY 
      client.balance
    LIMIT
      1;
  `;
}

export function credit(sql: postgres.Sql, clientId: number, valor: number, descricao: string) {
  type Result = {
    new_balance: number;
    error: boolean;
    message: string;
  };

  return sql<[Result]>`SELECT * FROM credit(${clientId}, ${valor}, ${descricao})`;
}

export function debit(sql: postgres.Sql, clientId: number, valor: number, descricao: string) {
  type Result = {
    new_balance: number;
    error: boolean;
    message: string;
  };

  return sql<[Result]>`SELECT * FROM debit(${clientId}, ${valor}, ${descricao})`;
}
