import {zipkin} from './typings/zipkin/index';

export function createTracer(endpoint: string, sampler?: number = 1): zipkin.Tracer;
// import * as zipkin from "zipkin";
// import {Middleware as KoaMiddleware} from "koa";
// import {RpcMiddleware} from 'sasdn';
// import {Connection} from 'typeorm';
//
// export interface TraceInfo {
//     tracer: zipkin.Tracer | false;
//     serviceName?: string;
//     remoteService?: {
//         serviceName?: string,
//         host?: string,
//         port?: number
//     };
//     port?: number;
// }
//
// export declare class KoaInstrumentation {
//     public static middleware(options: TraceInfo): KoaMiddleware;
// }
//
// export declare class GrpcInstrumentation {
//     public static middleware(info?: TraceInfo): RpcMiddleware;
//
//     public static proxyClient<T>(client: T, info?: TraceInfo, ctx?: object): T;
// }
//
// export declare class TypeOrmInstrumentation {
//     public static proxyConnection(conn: Connection, info?: TraceInfo, ctx?: object): Connection;
// }