"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const grpc = require("grpc");
const InstrumentationBase_1 = require("./abstract/InstrumentationBase");
const lib = require("../lib/lib");
const Trace = require("../Trace");
class GrpcImplExtendInstrumentationBase extends InstrumentationBase_1.InstrumentationBase {
    createMiddleware() {
        if (this.info.tracer === false) {
            return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                yield next();
            });
        }
        const tracer = this.info.tracer;
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.call.metadata;
            const traceId = Trace.createTraceId(lib.GrpcMetadata.containsRequired(req), lib.GrpcMetadata.getValue(req, zipkin.HttpHeaders.Flags), tracer, (name) => {
                const value = lib.GrpcMetadata.getValue(req, name);
                return Trace.buildZipkinOption(value);
            });
            console.log(req);
            console.log('gRPC traceId', traceId.traceId);
            ctx[zipkin.HttpHeaders.TraceId] = traceId;
            this.loggerServerReceive(traceId, 'rpc');
            yield next();
            this.loggerServerSend(traceId);
        });
    }
    createClient(client, ctx) {
        if (this.info.tracer === false) {
            return client;
        }
        const tracer = this.info.tracer;
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
                    // // create SpanId
                    // tracer.setId(tracer.createChildId());
                    // const traceId = tracer.id;
                    //
                    // _this.loggerClientSend(traceId, 'rpc', {
                    //     'rpc_query': property,
                    //     'rpc_query_params': JSON.stringify(arguments)
                    // });
                    //
                    // const argus = _this.updateArgumentWithMetadata(arguments, traceId, (callback) => {
                    //     return (err: Error, res: any) => {
                    //         if (err) {
                    //             _this.loggerClientReceive(traceId, {
                    //                 'rpc_end': `Error`,
                    //                 'rpc_end_response': err.message
                    //             });
                    //         } else {
                    //             let resObj: string;
                    //             try {
                    //                 resObj = JSON.stringify(res);
                    //             } catch (e) {
                    //                 resObj = res.toString();
                    //             }
                    //
                    //             _this.loggerClientReceive(traceId, {
                    //                 'rpc_end': `Callback`,
                    //                 'rpc_end_response': resObj
                    //             });
                    //         }
                    //         callback(err, res);
                    //     };
                    // });
                    // const call = original.apply(client, argus);
                    // call.on('end', () => {
                    //     _this.loggerClientReceive(traceId, {
                    //         'rpc_end': `Call`,
                    //     });
                    // });
                    let metadata = new grpc.Metadata();
                    metadata.add('A-B-C', '123');
                    console.log(arguments);
                    return original.apply(client, [arguments[0], metadata, arguments[2]]);
                };
            }
        });
        return client;
    }
    updateArgumentWithMetadata(argus, traceId, callback) {
        const oldArgus = Object.assign({}, argus);
        // argument length is 2 or 3
        // {'0': params, '1': function callback}
        // {'0': params, '1': metadata '2': function callback}
        const metadata = (argus.length == 3) ? argus[1] : new grpc.Metadata();
        metadata.add(zipkin.HttpHeaders.TraceId, traceId.traceId);
        metadata.add(zipkin.HttpHeaders.ParentSpanId, traceId.parentId);
        metadata.add(zipkin.HttpHeaders.SpanId, traceId.spanId);
        metadata.add(zipkin.HttpHeaders.Sampled, traceId.sampled.getOrElse() ? '1' : '0');
        return [argus[0], metadata, callback(argus.length == 2 ? oldArgus[1] : oldArgus[2])];
    }
}
exports.GrpcImplExtendInstrumentationBase = GrpcImplExtendInstrumentationBase;
