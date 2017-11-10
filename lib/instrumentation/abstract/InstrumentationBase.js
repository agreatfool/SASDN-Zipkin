"use strict";
///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const lib = require("../../lib/lib");
exports.defaultTraceInfo = {
    tracer: false,
    serviceName: 'unknown',
    port: 0,
};
class InstrumentationBase {
    constructor(info = exports.defaultTraceInfo) {
        this.info = info;
    }
    loggerServerReceive(traceId, method, recordBinarys = {}) {
        const tracer = this.info.tracer;
        const serviceName = this.info.serviceName || 'unknown';
        const port = this.info.port || 0;
        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.setId(traceId);
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
        const tracer = this.info.tracer;
        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.setId(traceId);
            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
        });
    }
    ;
    loggerClientSend(traceId, method, recordBinarys = {}) {
        const tracer = this.info.tracer;
        const serviceName = this.info.serviceName || 'unknown';
        const remoteService = this.info.remoteService || null;
        const port = this.info.port || 0;
        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.setId(traceId);
            tracer.recordServiceName(serviceName);
            tracer.recordRpc(method);
            tracer.recordAnnotation(new zipkin.Annotation.ClientSend());
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({ port }));
            if (remoteService) {
                tracer.recordAnnotation(new zipkin.Annotation.ServerAddr({
                    serviceName: remoteService.serviceName,
                    host: new zipkin.InetAddress(remoteService.host),
                    port: remoteService.port
                }));
            }
            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    }
    ;
    loggerClientReceive(traceId, recordBinarys = {}) {
        const tracer = this.info.tracer;
        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.setId(traceId);
            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
        });
    }
    ;
}
exports.InstrumentationBase = InstrumentationBase;
