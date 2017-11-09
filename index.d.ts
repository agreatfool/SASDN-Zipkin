///<reference path="./node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import {Middleware as KoaMiddleware, Context as KoaContext} from 'koa';
import {RpcContext, RpcMiddleware} from 'sasdn';

// /src/Trace.ts
export function buildZipkinOption(value: string): zipkin.Option;

export function createTracer(endpoint: string, sampler?: number = 1): zipkin.Tracer;

export function createTraceId(isChildNode: boolean, flag: any, tracer: zipkin.Tracer, zipkinOption: (name: string) => zipkin.Option): zipkin.TraceId;

// /src/instrumentation/abstract/InstrumentationBase.ts
export interface TraceInfo {
    tracer: zipkin.Tracer | false;
    serviceName?: string;
    remoteService?: {
        serviceName?: string;
        host?: string;
        port?: number;
    };
    port?: number;
}

interface RecordBinaryMap {
    [key: string]: string;
}

export declare abstract class InstrumentationBase {
    protected info: TraceInfo;

    public constructor(info: TraceInfo);

    public abstract createMiddleware(): KoaMiddleware | RpcMiddleware;

    public abstract createClient<T>(client: T, ctx?: KoaContext | RpcContext): T;

    protected loggerServerReceive(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap = {});

    protected loggerServerSend(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void;

    protected loggerClientSend(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap = {}): void;

    protected loggerClientReceive(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void;
}

export class GrpcImplExtendInstrumentationBase extends InstrumentationBase {
    public createMiddleware();

    public createClient<T>(client: T, ctx?: RpcContext): T;
}

export class KoaImplExtendInstrumentationBase extends InstrumentationBase {
    public createMiddleware();

    protected createClient<T>(client: T, ctx?: RpcContext): T;
}

export class TypeOrmImplExtendInstrumentationBase extends InstrumentationBase {
    protected createMiddleware();

    public createClient<T>(client: T, ctx?: RpcContext): T;
}