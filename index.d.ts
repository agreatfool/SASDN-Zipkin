import * as zipkin from 'zipkin';

// /src/Trace.ts
export function buildZipkinOption(value: string): zipkin.Option;

export function createTracer(endpoint: string, sampler?: number): zipkin.Tracer;

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

export interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

interface RecordBinaryMap {
    [key: string]: string;
}

declare abstract class InstrumentationBase {
    protected info: TraceInfo;

    public constructor(info: TraceInfo);

    public abstract createMiddleware(): Middleware;

    public abstract createClient<T>(client: T, ctx?: object): T;

    protected loggerServerReceive(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap);

    protected loggerServerSend(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap): void;

    protected loggerClientSend(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap): void;

    protected loggerClientReceive(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap): void;
}

export class GrpcImplExtendInstrumentationBase extends InstrumentationBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class KoaImplExtendInstrumentationBase extends InstrumentationBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class TypeOrmImplExtendInstrumentationBase extends InstrumentationBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}