///<reference path="../../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as lib from '../../lib/lib';

export interface TraceInfo {
    tracer: zipkin.Tracer | false;
    serviceName?: string;
    remoteService?: {
        serviceName?: string;
        host?: string;
        port?: number;
    };
    port?: number;
}

export interface Middleware {
    (ctx: any, next: () => Promise<any>): Promise<any>
}

interface RecordBinaryMap {
    [key: string]: string;
}

export const defaultTraceInfo: TraceInfo = {
    tracer: false,
    serviceName: 'unknown',
    port: 0,
};

export abstract class InstrumentationBase {

    protected info: TraceInfo;

    public constructor(info: TraceInfo = defaultTraceInfo) {
        this.info = info;
    }

    public abstract createMiddleware(): Middleware;

    public abstract createClient<T>(client: T, ctx?: object): T;

    protected loggerServerReceive(traceId: zipkin.TraceId, method: string, recordBinarys: RecordBinaryMap = {}) {
        const tracer = this.info.tracer as zipkin.Tracer;
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
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({port}));

            if (traceId.flags !== 0 && traceId.flags != null) {
                tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
            }
        });
    };

    protected loggerServerSend(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void {
        const tracer = this.info.tracer as zipkin.Tracer;

        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }

            tracer.setId(traceId);
            tracer.recordAnnotation(new zipkin.Annotation.ServerSend());
        });
    };

    protected loggerClientSend(traceId: zipkin.TraceId, method: string, recordBinarys: RecordBinaryMap = {}): void {
        const tracer = this.info.tracer as zipkin.Tracer;
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
            tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({port}));

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
    };

    protected loggerClientReceive(traceId: zipkin.TraceId, recordBinarys: RecordBinaryMap = {}): void {
        const tracer = this.info.tracer as zipkin.Tracer;

        tracer.scoped(() => {
            for (const key in recordBinarys) {
                tracer.recordBinary(lib.replaceRecordBinaryKey(key), recordBinarys[key]);
            }

            tracer.setId(traceId);
            tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());
        });
    };

}