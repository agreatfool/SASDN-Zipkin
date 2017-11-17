"use strict";
///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const lib = require("../../lib/lib");
const TracerHelper_1 = require("../../TracerHelper");
class ZipkinBase {
    constructor() {
    }
    static initTracerInfo(endpoint, info) {
        TracerHelper_1.TracerHelper.instance().init(endpoint, info);
    }
    ;
    static setTracerInfo(info) {
        if (info.serviceName) {
            TracerHelper_1.TracerHelper.instance().setServiceName(info.serviceName);
        }
        if (info.port) {
            TracerHelper_1.TracerHelper.instance().setPort(info.port);
        }
        if (info.remoteService) {
            TracerHelper_1.TracerHelper.instance().setRemoteService(info.remoteService);
        }
    }
    ;
    loggerServerReceive(traceId, method, recordBinarys = {}) {
        const info = TracerHelper_1.TracerHelper.instance().getTraceInfo();
        const tracer = TracerHelper_1.TracerHelper.instance().getTracer();
        const serviceName = info.serviceName || 'unknown';
        const port = info.port || 0;
        tracer.scoped(() => {
            tracer.setId(traceId);
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordServiceName(serviceName);
            tracer.recordRpc(method);
            tracer.recordAnnotation(new zipkin.Annotation.ServerRecv());
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({ port }));
            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    }
    ;
    loggerServerSend(traceId, recordBinarys = {}) {
        const tracer = TracerHelper_1.TracerHelper.instance().getTracer();
        tracer.scoped(() => {
            tracer.setId(traceId);
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
        });
    }
    ;
    loggerClientSend(traceId, method, recordBinarys = {}) {
        const info = TracerHelper_1.TracerHelper.instance().getTraceInfo();
        const tracer = TracerHelper_1.TracerHelper.instance().getTracer();
        const serviceName = info.serviceName || 'unknown';
        const remoteService = info.remoteService || null;
        const port = info.port || 0;
        tracer.scoped(() => {
            tracer.setId(traceId);
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordServiceName(serviceName);
            tracer.recordRpc(method);
            tracer.recordAnnotation(new zipkin.Annotation.ClientSend());
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({ port }));
            if (remoteService) {
                tracer.recordAnnotation(new zipkin.Annotation.ServerAddr({
                    serviceName: (remoteService.serviceName) ? remoteService.serviceName : null,
                    host: (remoteService.host) ? new zipkin.InetAddress(remoteService.host) : null,
                    port: (remoteService.port) ? remoteService.port : null,
                }));
            }
            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    }
    ;
    loggerClientReceive(traceId, recordBinarys = {}) {
        const tracer = TracerHelper_1.TracerHelper.instance().getTracer();
        tracer.scoped(() => {
            tracer.setId(traceId);
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
        });
    }
    ;
}
exports.ZipkinBase = ZipkinBase;
