import * as zipkin from 'zipkin';
import {Middleware as KoaMiddleware} from 'koa';
import {RpcContext, RpcMiddleware} from 'sasdn';
import {InstrumentationBase, TraceInfo, defaultTraceInfo} from './abstract/InstrumentationBase';
import {Repository, SelectQueryBuilder} from 'typeorm';

export class TypeOrmImplExtendInstrumentationBase extends InstrumentationBase {

    public createMiddleware(info: TraceInfo = defaultTraceInfo): KoaMiddleware | RpcMiddleware {
        throw new Error('Only the server type instrumentation are allowed to use createMiddleware!');
    }

    public createClient<T>(client: T, ctx?: RpcContext): T {
        if (this.info.tracer === false || client['proxy'] == true) {
            return client;
        }

        const tracer = this.info.tracer as zipkin.Tracer;

        if (ctx
            && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
            && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
            tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
        }

        const getRepositoryOriginal = client['getRepository'];
        client['getRepository'] = function <Entity>(): Repository<Entity> {
            const repository = getRepositoryOriginal.apply(client, arguments);
            if (client['proxy'] == true) {
                return repository;
            }

            const createQueryBuilderOriginal = client['createQueryBuilder'];
            client['createQueryBuilder'] = function (): SelectQueryBuilder<Entity> {
                const queryBuilder = createQueryBuilderOriginal.apply(client, arguments);

                Object.getOwnPropertyNames(Object.getPrototypeOf(queryBuilder)).forEach((property) => {

                    if (property == 'stream'
                        || property == 'executeCountQuery'
                        || property == 'loadRawResults') {
                        const original = queryBuilder[property];

                        queryBuilder[property] = function () {

                            // create SpanId
                            tracer.setId(tracer.createChildId());
                            const traceId = tracer.id;

                            this.loggerClientSend(traceId, 'db_query', {
                                'db_sql': queryBuilder['getSql'](),
                                'rpc_query_params': JSON.stringify(arguments)
                            });

                            const call = original.apply(queryBuilder, arguments) as Promise<any>;
                            return call.then((res) => {
                                let resObj: string;
                                try {
                                    resObj = JSON.stringify(res);
                                } catch (e) {
                                    resObj = res.toString();
                                }

                                this.loggerClientReceive(traceId, {
                                    'db_end': `Succeed`,
                                    'db_response': resObj
                                });
                                return res;
                            }).catch((err) => {
                                this.loggerClientReceive(traceId, {
                                    'db_end': `Error`,
                                    'db_response': err.message
                                });
                                throw err;
                            });
                        };
                    }
                });

                client['proxy'] = true;
                return queryBuilder;
            };

            return repository;
        };

        return client;
    }
}