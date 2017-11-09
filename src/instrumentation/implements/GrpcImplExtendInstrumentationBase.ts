import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import {MiddlewareNext, RpcContext} from 'sasdn';
import {InstrumentationBase} from '../InstrumentationBase';
import * as lib from '../../lib/lib';
import * as Trace from '../../Trace';

export class GrpcImplExtendInstrumentationBase extends InstrumentationBase {

    public createMiddleware() {
        if (this.info.tracer === false) {
            return async (ctx: RpcContext, next: MiddlewareNext) => {
                await next();
            };
        }

        const tracer = this.info.tracer as zipkin.Tracer;

        return async (ctx: RpcContext, next: MiddlewareNext) => {

            const req = ctx.call.metadata;

            const traceId = Trace.createTraceId(
                lib.GrpcMetadata.containsRequired(req),
                lib.GrpcMetadata.getValue(req, zipkin.HttpHeaders.Flags),
                tracer,
                (name: string) => {
                    const value = lib.GrpcMetadata.getValue(req, name);
                    return Trace.buildZipkinOption(value.toString());
                }
            );

            tracer.setId(traceId);
            ctx[zipkin.HttpHeaders.TraceId] = traceId;

            this.loggerServerReceive(traceId, 'rpc');

            await next();

            this.loggerServerSend(traceId);
        };
    }

    public createClient<T>(client: T, ctx?: RpcContext): T {
        if (this.info.tracer === false) {
            return client;
        }

        const tracer = this.info.tracer as zipkin.Tracer;

        if (ctx
            && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
            && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
            tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
        }

        Object.getOwnPropertyNames(Object.getPrototypeOf(client)).forEach((property) => {
            const original = client[property];
            if (property != 'constructor' && typeof original == 'function') {

                client[property] = function () {
                    // has grpc.Metadata
                    if (arguments[0] instanceof grpc.Metadata || arguments[1] instanceof grpc.Metadata) {
                        return original.apply(client, arguments);
                    }

                    // create SpanId
                    tracer.setId(tracer.createChildId());
                    const traceId = tracer.id;

                    this.loggerClientSend(traceId, 'rpc', {
                        'rpc_query': property,
                        'rpc_query_params': JSON.stringify(arguments)
                    });

                    const metadata = lib.GrpcMetadata.makeMetadata(traceId);
                    const argus = lib.replaceArguments(arguments, metadata, (callback) => {
                        return (err: Error, res: any) => {
                            if (err) {
                                this.loggerClientReceive(traceId, {
                                    'rpc_end': `Error`,
                                    'rpc_end_response': err.message
                                });
                            } else {
                                let resObj: string;
                                try {
                                    resObj = JSON.stringify(res);
                                } catch (e) {
                                    resObj = res.toString();
                                }

                                this.loggerClientReceive(traceId, {
                                    'rpc_end': `Callback`,
                                    'rpc_end_response': resObj
                                });
                            }
                            callback(err, res);
                        };
                    });

                    const call = original.apply(client, argus);

                    call.on('end', function () {
                        this.loggerClientReceive(traceId, {
                            'rpc_end': `Call`,
                        });
                    });

                    return call;
                };
            }
        });

        return client;
    }
}
