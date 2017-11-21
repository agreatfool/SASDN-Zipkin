"use strict";
///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const lib = require("../../lib/lib");
const Trace_1 = require("../../Trace");
class ZipkinBase {
    constructor() {
    }
    /**
     * 初始化 Trace 数据
     *
     * @param {string} url Zipkin Collector API url.
     * @param {ServiceInfo} serviceInfo
     */
    static init(url, serviceInfo) {
        Trace_1.Trace.instance.init(url, serviceInfo);
    }
    ;
    /**
     * 更新 Trace 的 Receiver 数据
     *
     * @param {ServiceInfo} serviceInfo
     */
    static setReceiverServiceInfo(serviceInfo) {
        Trace_1.Trace.instance.receiverServiceInfo = serviceInfo;
    }
    /**
     * 添加自定义的 RecordMap
     *
     * @param {RecordMap} recordMap
     */
    setCustomizedRecordMap(recordMap) {
        this._customizedRecordMap = recordMap;
    }
    /**
     * 记录 Zipkin ServerRecv 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    _logServerReceive(traceId, method, records = {}) {
        const tracer = Trace_1.Trace.instance.tracer;
        const { serviceName, host, port } = Trace_1.Trace.instance.currentServiceInfo;
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
    }
    ;
    /**
     * 记录 Zipkin ServerSend 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    _logServerSend(traceId, records = {}) {
        const tracer = Trace_1.Trace.instance.tracer;
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
    }
    ;
    /**
     * 记录 Zipkin Client Send 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {string} method
     * @param {RecordMap} records
     * @private
     */
    _logClientSend(traceId, method, records = {}) {
        const tracer = Trace_1.Trace.instance.tracer;
        const { serviceName, host, port } = Trace_1.Trace.instance.currentServiceInfo;
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
            const receiverServiceInfo = Trace_1.Trace.instance.receiverServiceInfo;
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
    }
    ;
    /**
     * 记录 Zipkin Client Recv 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {RecordMap} records
     * @private
     */
    _logClientReceive(traceId, records = {}) {
        const tracer = Trace_1.Trace.instance.tracer;
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
    }
    ;
}
exports.ZipkinBase = ZipkinBase;
