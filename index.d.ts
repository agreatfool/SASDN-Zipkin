import * as zipkin from 'zipkin';

export interface TraceInfo {
    serviceName?: string;
    port?: number;
    remoteService?: RemoteTraceInfo;
}

export interface RemoteTraceInfo {
    serviceName?: string;
    host?: string;
    port?: number;
}

export interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

interface RecordBinaryMap {
    [key: string]: string;
}

declare abstract class ZipkinBase {

    public constructor();

    public static initTracerInfo(endpoint: string, info: TraceInfo): void;

    public static setTracerInfo(info: TraceInfo): void;

    public abstract createMiddleware(): Middleware;

    public abstract createClient<T>(client: T, ctx?: object): T;

    protected loggerServerReceive(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap);

    protected loggerServerSend(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap): void;

    protected loggerClientSend(traceId: zipkin.TraceId, recordRpc: string, recordBinarys: RecordBinaryMap): void;

    protected loggerClientReceive(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap): void;
}

export class GrpcImpl extends ZipkinBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class KoaImpl extends ZipkinBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class TypeOrmImpl extends ZipkinBase {
    public createMiddleware(): Middleware;

    public createClient<T>(client: T, ctx?: object): T;
}