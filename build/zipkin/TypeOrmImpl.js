"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const ZipkinBase_1 = require("./abstract/ZipkinBase");
const TracerHelper_1 = require("../TracerHelper");
class TypeOrmImpl extends ZipkinBase_1.ZipkinBase {
    createMiddleware() {
        throw new Error('Only the server type instrumentation are allowed to use createMiddleware!');
    }
    createClient(client, ctx) {
        const tracer = TracerHelper_1.TracerHelper.instance().getTracer();
        if (tracer === null || client['proxy'] == true) {
            return client;
        }
        if (ctx
            && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
            && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
            tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
        }
        const getRepositoryOriginal = client['getRepository'];
        const _this = this;
        client['getRepository'] = function () {
            const repository = getRepositoryOriginal.apply(client, arguments);
            if (client['proxy'] == true) {
                return repository;
            }
            const createQueryBuilderOriginal = client['createQueryBuilder'];
            client['createQueryBuilder'] = function () {
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
                            _this.loggerClientSend(traceId, 'db_query', {
                                'db_sql': queryBuilder['getSql']()
                            });
                            const call = original.apply(queryBuilder, arguments);
                            return call.then((res) => {
                                let resObj;
                                try {
                                    resObj = JSON.stringify(res);
                                }
                                catch (e) {
                                    resObj = res.toString();
                                }
                                _this.loggerClientReceive(traceId, {
                                    'db_end': `Succeed`,
                                    'db_response': resObj
                                });
                                return res;
                            }).catch((err) => {
                                _this.loggerClientReceive(traceId, {
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
exports.TypeOrmImpl = TypeOrmImpl;
