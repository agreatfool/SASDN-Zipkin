"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const lib = require("../../lib/lib");
const Trace_1 = require("../../Trace");
var ZIPKIN_EVENT;
(function (ZIPKIN_EVENT) {
    ZIPKIN_EVENT["SERVER_RECV"] = "ServerReceive";
    ZIPKIN_EVENT["SERVER_SEND"] = "ServerSend";
    ZIPKIN_EVENT["CLIENT_SEND"] = "ClientSend";
    ZIPKIN_EVENT["CLIENT_RECV"] = "ClientReceive";
})(ZIPKIN_EVENT = exports.ZIPKIN_EVENT || (exports.ZIPKIN_EVENT = {}));
class ZipkinBase {
    constructor() {
        this._customizedSRRecords = {};
        this._customizedSSRecords = {};
        this._customizedCSRecords = {};
        this._customizedCRRecords = {};
    }
    /**
     * 初始化 Trace 数据
     *
     * @param {ServiceInfo} serviceInfo
     */
    static init(serviceInfo) {
        Trace_1.Trace.instance.init(serviceInfo);
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
     * @param {ZIPKIN_EVENT.SERVER_RECV | ZIPKIN_EVENT.SERVER_SEND | ZIPKIN_EVENT.CLIENT_SEND | ZIPKIN_EVENT.CLIENT_RECV} event
     * @param {RecordMap} records
     */
    setCustomizedRecords(event, records) {
        switch (event) {
            case ZIPKIN_EVENT.SERVER_RECV:
                this._customizedSRRecords = records;
                break;
            case ZIPKIN_EVENT.SERVER_SEND:
                this._customizedSSRecords = records;
                break;
            case ZIPKIN_EVENT.CLIENT_SEND:
                this._customizedCSRecords = records;
                break;
            case ZIPKIN_EVENT.CLIENT_RECV:
                this._customizedCRRecords = records;
                break;
        }
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
            for (const key in this._customizedSRRecords) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedSRRecords[key]);
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
            this._customizedSRRecords = {};
        });
    }
    ;
    /**
     * 记录 Zipkin ServerSend 事件
     *
     * @param {zipkin.TraceId} traceId
     * @param {RecordMap} records
     * @private
     */
    _logServerSend(traceId, records = {}) {
        const tracer = Trace_1.Trace.instance.tracer;
        tracer.scoped(() => {
            tracer.setId(traceId);
            for (const key in this._customizedSSRecords) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedSSRecords[key]);
            }
            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
            this._customizedSSRecords = {};
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
            for (const key in this._customizedCSRecords) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedCSRecords[key]);
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
            if (traceId.flags && traceId.flags !== 0) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
            this._customizedCSRecords = {};
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
            for (const key in this._customizedCRRecords) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedCRRecords[key]);
            }
            for (const key in records) {
                tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
            this._customizedCRRecords = {};
        });
    }
    ;
}
exports.ZipkinBase = ZipkinBase;
