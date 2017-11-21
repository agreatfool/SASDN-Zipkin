import {Middleware as KoaMiddleware} from 'koa';
import {RpcMiddleware} from 'sasdn';


interface RecordMap {
    [key: string]: string;
}

export enum ZIPKIN_EVENT {
    SERVER_RECV = 'sr',
    SERVER_SEND = 'ss',
    CLIENT_SEND = 'cs',
    CLIENT_RECV = 'cr'
}

export interface ServiceInfo {
    serviceName?: string;
    host?: string;
    port?: number;
}

declare abstract class ZipkinBase {
    public constructor();

    public static init(url: string, serviceInfo: ServiceInfo): void;

    public static setReceiverServiceInfo(serviceInfo: ServiceInfo): void;

    public setCustomizedRecords(event: ZIPKIN_EVENT.SERVER_RECV | ZIPKIN_EVENT.SERVER_SEND | ZIPKIN_EVENT.CLIENT_SEND | ZIPKIN_EVENT.CLIENT_RECV,
                                records: RecordMap): void;

    public abstract createMiddleware(): RpcMiddleware | KoaMiddleware;

    public abstract createClient<T>(client: T, ctx?: object): T;
}

export class GrpcImpl extends ZipkinBase {
    public createMiddleware(): RpcMiddleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class KoaImpl extends ZipkinBase {
    public createMiddleware(): KoaMiddleware;

    public createClient<T>(client: T, ctx?: object): T;
}

export class TypeOrmImpl extends ZipkinBase {
    public createMiddleware();

    public createClient<T>(client: T, ctx?: object): T;
}