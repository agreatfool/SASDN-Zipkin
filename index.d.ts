import * as zipkin from 'zipkin';

export interface ServiceInfo {
    serviceName?: string;
    host?: string;
    port?: number;
}

export interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

interface RecordMap {
    [key: string]: string;
}

declare abstract class ZipkinBase {
    public constructor();

    public static init(url: string, serviceInfo: ServiceInfo): void;

    public static setReceiverServiceInfo(serviceInfo: ServiceInfo): void;

    public setCustomizedRecordMap(recordMap: RecordMap): void;

    public abstract createMiddleware(): Middleware;

    public abstract createClient<T>(client: T, ctx?: object): T;
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