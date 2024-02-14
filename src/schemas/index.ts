import Ajv from 'ajv';
import fastJsonStringify from 'fast-json-stringify';
import { S } from 'fluent-json-schema';
import type { ITransacaoBody } from './types.js';

export const SchemaCompiler = new Ajv.default();

export const TransacaoBody = SchemaCompiler.compile<ITransacaoBody>(
  S.object()
    .prop('valor', S.integer().minimum(0))
    .prop('tipo', S.string().enum(['c', 'd']))
    .prop('descricao', S.string().minLength(1).maxLength(10))
    .valueOf()
);

export const TransacaoReply = fastJsonStringify(
  S.object().prop('limite', S.integer().minimum(0)).prop('saldo', S.integer()).valueOf()
);

export const ExtratoReply = fastJsonStringify(
  S.object()
    .prop(
      'saldo',
      S.object()
        .prop('total', S.integer())
        .prop('data_extrato', S.string().format('date-time'))
        .prop('limite', S.integer())
    )
    .prop(
      'ultimas_transacoes',
      S.array().items(
        S.object()
          .prop('valor', S.integer())
          .prop('tipo', S.string().enum(['c', 'd']))
          .prop('descricao', S.string())
          .prop('realizada_em', S.string().format('date-time'))
      )
    )
    .valueOf()
);

export const RequestErrorReply = fastJsonStringify(
  S.object()
    .prop('message', S.string())
    .prop('status', S.integer())
    .prop('json', S.object().additionalProperties(true))
    .valueOf()
);
