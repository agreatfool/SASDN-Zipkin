"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const ZipkinBase_1 = require("./abstract/ZipkinBase");
const Trace_1 = require("../Trace");
class TypeOrmImpl extends ZipkinBase_1.ZipkinBase {
    createMiddleware() {
        throw new Error('Only the server type instrumentation are allowed to use createMiddleware!');
    }
    createClient(conn, ctx) {
        const tracer = Trace_1.Trace.instance.tracer;
        if (!tracer || conn['proxy'] == true) {
            return conn;
        }
        // 判断 ctx 中是否存在 traceId，如果存在则这个代理客户端会根据 traceId 生成一个 child traceId
        if (ctx
            && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
            && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
            tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
        }
        // 将数据库连接进行改造，返回数据 repository 中携带被改造的方法。
        // conn.getRepository()
        const originalConnCreateQueryBuilder = conn['createQueryBuilder'];
        function proxyConnCreateQueryBuilder() {
            const queryBuilder = originalConnCreateQueryBuilder.apply(conn, arguments);
            if (conn['proxy'] == true) {
                return queryBuilder;
            }
            Object.getOwnPropertyNames(Object.getPrototypeOf(queryBuilder)).forEach((property) => {
                if (property == 'stream' || property == 'executeCountQuery' || property == 'loadRawResults') {
                    const original = queryBuilder[property];
                    function proxyQueryExecute() {
                        // create SpanId
                        tracer.setId(tracer.createChildId());
                        const traceId = tracer.id;
                        this._logClientSend(traceId, 'db_query', {
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
                            this._logClientReceive(traceId, {
                                'db_end': `Succeed`,
                                'db_response': resObj
                            });
                            return res;
                        }).catch((err) => {
                            this._logClientReceive(traceId, {
                                'db_end': `Error`,
                                'db_response': err.message
                            });
                            throw err;
                        });
                    }
                    queryBuilder[property] = proxyQueryExecute.bind(this);
                }
            });
            return queryBuilder;
        }
        const originalGetRepository = conn['getRepository'];
        function proxyGetRepository() {
            const repository = originalGetRepository.apply(conn, arguments);
            if (conn['proxy'] == true) {
                return repository;
            }
            // conn.getRepository().createQueryBuilder()
            const originalCreateQueryBuilder = repository['createQueryBuilder'];
            function proxyCreateQueryBuilder() {
                const queryBuilder = originalCreateQueryBuilder.apply(repository, arguments);
                // 遍历 SelectQueryBuilder 中的所有方法，找到 stream，executeCountQuery，loadRawResults 方法并进行参数改造
                Object.getOwnPropertyNames(Object.getPrototypeOf(queryBuilder)).forEach((property) => {
                    if (property == 'stream' || property == 'executeCountQuery' || property == 'loadRawResults') {
                        const original = queryBuilder[property];
                        function proxyQueryExecute() {
                            // create SpanId
                            tracer.setId(tracer.createChildId());
                            const traceId = tracer.id;
                            this._logClientSend(traceId, 'db_query', {
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
                                this._logClientReceive(traceId, {
                                    'db_end': `Succeed`,
                                    'db_response': resObj
                                });
                                return res;
                            }).catch((err) => {
                                this._logClientReceive(traceId, {
                                    'db_end': `Error`,
                                    'db_response': err.message
                                });
                                throw err;
                            });
                        }
                        queryBuilder[property] = proxyQueryExecute.bind(this);
                    }
                });
                return queryBuilder;
            }
            conn['proxy'] = true;
            repository['createQueryBuilder'] = proxyCreateQueryBuilder.bind(this);
            return repository;
        }
        conn['createQueryBuilder'] = proxyConnCreateQueryBuilder.bind(this);
        conn['getRepository'] = proxyGetRepository.bind(this);
        return conn;
    }
}
exports.TypeOrmImpl = TypeOrmImpl;
