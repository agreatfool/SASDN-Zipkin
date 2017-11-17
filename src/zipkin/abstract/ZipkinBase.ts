///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as lib from '../../lib/lib';
import {RemoteTraceInfo, TraceInfo, TracerHelper} from '../../TracerHelper';

export interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

interface RecordBinaryMap {
    [key: string]: string;
}

export abstract class ZipkinBase {

    public constructor() {

    }

    public static initTracerInfo(endpoint: string, info: TraceInfo): void {
        TracerHelper.instance().init(endpoint, info);
    };

    public static setTracerInfo(info: TraceInfo): void {
        if (info.serviceName) {
            TracerHelper.instance().setServiceName(info.serviceName);
        }
        if (info.port) {
            TracerHelper.instance().setPort(info.port);
        }
        if (info.remoteService) {
            TracerHelper.instance().setRemoteService(info.remoteService);
        }
    };

    public abstract createMiddleware(): Middleware;

    public abstract createClient<T>(client: T, ctx?: object): T;

    protected loggerServerReceive(traceId: zipkin.TraceId, method: string, recordBinarys: RecordBinaryMap = {}) {
        const info = TracerHelper.instance().getTraceInfo();
        const tracer = TracerHelper.instance().getTracer();
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
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({port}));

            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    };

    protected loggerServerSend(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void {
        const tracer = TracerHelper.instance().getTracer();

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
        });
    };

    protected loggerClientSend(traceId: zipkin.TraceId, method: string, recordBinarys: RecordBinaryMap = {}): void {
        const info = TracerHelper.instance().getTraceInfo();
        const tracer = TracerHelper.instance().getTracer();
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
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({port}));

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
    };

    protected loggerClientReceive(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void {
        const tracer = TracerHelper.instance().getTracer();

        tracer.scoped(() => {
            tracer.setId(traceId);

            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }
            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
        });
    };

}