///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as lib from '../../lib/lib';
import {ServiceInfo, Trace} from '../../Trace';

interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

export interface RecordMap {
    [key: string]: string;
}

export abstract class ZipkinBase {

    private _customizedRecordMap: RecordMap;

    public constructor() {

    }

    /**
     * 初始化 Trace 数据
     *
     * @param {string} url Zipkin Collector API url.
     * @param {ServiceInfo} serviceInfo
     */
    public static init(url: string, serviceInfo: ServiceInfo): void {
        Trace.instance.init(url, serviceInfo)
    };

    /**
     * 更新 Trace 的 Receiver 数据
     *
     * @param {ServiceInfo} serviceInfo
     */
    public static setReceiverServiceInfo(serviceInfo: ServiceInfo): void {
        Trace.instance.setReceiverServiceInfo(serviceInfo)
    }

    /**
     * 添加自定义的 RecordMap
     *
     * @param {RecordMap} recordMap
     */
    public setCustomizedRecordMap(recordMap: RecordMap): void {
        this._customizedRecordMap = recordMap;
    }

    /**
     * 创建服务器中间件
     *
     * @returns {Middleware}
     */
    public abstract createMiddleware(): Middleware;

    /**
     * 创建代理客户端
     *
     * @param {T} client
     * @param {Object} ctx
     * @returns {T}
     */
    public abstract createClient<T>(client: T, ctx?: object): T;

    /**
     * 记录 Zipkin ServerRecv 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    protected _logServerReceive(traceId: zipkin.TraceId, method: string, records: RecordMap = {}) {
        const tracer = Trace.instance.tracer;
        const {serviceName, host, port} = Trace.instance.currentServiceInfo;

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in this._customizedRecordMap) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedRecordMap[key]);
            }

            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }

            tracer.recordServiceName(serviceName || 'unknown');
            tracer.recordRpc(method);
            tracer.recordAnnotation(new zipkin.Annotation.ServerRecv());
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({
                host: (host) ? new zipkin.InetAddress(host) : null,
                port: port || 0
            }));

            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    };

    /**
     * 记录 Zipkin ServerSend 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    protected _logServerSend(traceId: zipkin.TraceId, records: RecordMap = {}): void {
        const tracer = Trace.instance.tracer;

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in this._customizedRecordMap) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedRecordMap[key]);
            }

            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }

            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
        });
    };

    /**
     * 记录 Zipkin Client Send 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    protected _logClientSend(traceId: zipkin.TraceId, method: string, records: RecordMap = {}): void {
        const tracer = Trace.instance.tracer;
        const {serviceName, host, port} = Trace.instance.currentServiceInfo;

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in this._customizedRecordMap) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedRecordMap[key]);
            }

            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }

            tracer.recordServiceName(serviceName || 'unknown');
            tracer.recordRpc(method);
            tracer.recordAnnotation(new zipkin.Annotation.ClientSend());
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({
                host: (host) ? new zipkin.InetAddress(host) : null,
                port: port || 0
            }));

            const receiverServiceInfo = Trace.instance.receiverServiceInfo;
            if (receiverServiceInfo) {
                tracer.recordAnnotation(new zipkin.Annotation.ServerAddr({
                    serviceName: receiverServiceInfo.serviceName || 'unknown',
                    host: (receiverServiceInfo.host) ? new zipkin.InetAddress(receiverServiceInfo.host) : null,
                    port: receiverServiceInfo.port || 0
                }));
            }

            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    };

    /**
     * 记录 Zipkin Client Recv 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {RecordMap} records
     * @private
     */
    protected _logClientReceive(traceId: zipkin.TraceId, records: RecordMap = {}): void {
        const tracer = Trace.instance.tracer;

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in this._customizedRecordMap) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedRecordMap[key]);
            }

            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }

            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
        });
    };

}