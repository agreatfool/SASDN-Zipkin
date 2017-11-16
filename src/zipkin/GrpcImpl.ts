import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import {ZipkinBase} from './abstract/ZipkinBase';
import * as lib from '../lib/lib';
import {TracerHelper} from '../TracerHelper';

export declare class GrpcContext {
    call: grpc.IServerCall;
}

export class GrpcImpl extends ZipkinBase {

    public createMiddleware() {
        const tracer = TracerHelper.instance().getTracer();
        if (tracer === null) {
            return async (ctx: GrpcContext, next: () => Promise<any>) => {
                await next();
            };
        }

        return async (ctx: GrpcContext, next: () => Promise<any>) => {
            const req = ctx.call.metadata;
            const traceId = lib.createTraceId(
                lib.GrpcMetadata.containsRequired(req),
                lib.GrpcMetadata.getValue(req, zipkin.HttpHeaders.Flags),
                tracer,
                (name: string) => {
                    const value = lib.GrpcMetadata.getValue(req, name);
                    return lib.buildZipkinOption(value);
                }
            );
            ctx[zipkin.HttpHeaders.TraceId] = traceId;

            this.loggerServerReceive(traceId, 'rpc');

            await next();

            this.loggerServerSend(traceId);
        };
    }

    public createClient<T>(client: T, ctx?: object): T {
        const tracer = TracerHelper.instance().getTracer();
        if (tracer === null) {
            return client;
        }

        if (ctx
            && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
            && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
            tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
        }

        Object.getOwnPropertyNames(Object.getPrototypeOf(client)).forEach((property) => {
            const original = client[property];
            if (property != 'constructor' && typeof original == 'function') {
                const _this = this;
                client[property] = function () {
                    // create SpanId
                    tracer.setId(tracer.createChildId());
                    const traceId = tracer.id;

                    _this.loggerClientSend(traceId, 'rpc', {
                        'rpc_query': property,
                        'rpc_query_params': JSON.stringify(arguments)
                    });

                    const argus = _this.updateArgumentWithMetadata(arguments, traceId, (callback) => {
                        return (err: Error, res: any) => {
                            if (err) {
                                _this.loggerClientReceive(traceId, {
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

                                _this.loggerClientReceive(traceId, {
                                    'rpc_end': `Callback`,
                                    'rpc_end_response': resObj
                                });
                            }
                            callback(err, res);
                        };
                    });

                    const call = original.apply(client, argus);

                    call.on('end', () => {
                        _this.loggerClientReceive(traceId, {
                            'rpc_end': `Call`,
                        });
                    });
                };
            }
        });

        return client;
    }

    private updateArgumentWithMetadata(argus: IArguments, traceId: zipkin.TraceId, callback: Function): Array<any> {
        // argument length is 2 or 3
        // {'0': params, '1': function callback}
        // {'0': params, '1': metadata '2': function callback}

        const metadata = (argus.length == 3) ? argus[1] : new grpc.Metadata();
        metadata.add(zipkin.HttpHeaders.TraceId, traceId.traceId);
        metadata.add(zipkin.HttpHeaders.ParentSpanId, traceId.parentId);
        metadata.add(zipkin.HttpHeaders.SpanId, traceId.spanId);
        metadata.add(zipkin.HttpHeaders.Sampled, traceId.sampled.getOrElse() ? '1' : '0');

        return [argus[0], metadata, callback(argus.length == 2 ? argus[1] : argus[2])];
    }
}
