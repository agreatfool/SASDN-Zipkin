import * as zipkin from 'zipkin';
import * as TransportHttp from 'zipkin-transport-http';
import * as CLSContext from 'zipkin-context-cls';

export interface TraceInfo {
    serviceName?: string;
    port?: number;
    remoteService?: RemoteTraceInfo;
}

export interface RemoteTraceInfo {
    serviceName?: string;
    host?: string;
    port?: number;
}

export class TracerHelper {

    private static _instance: TracerHelper;

    private _initialized: boolean = false;
    private _tracer: zipkin.Tracer = null;
    private _serviceName: string = 'unknown';
    private _remoteService: RemoteTraceInfo = {};
    private _port: number = 0;

    public static instance(): TracerHelper {
        if (TracerHelper._instance === undefined) {
            TracerHelper._instance = new TracerHelper();
        }
        return TracerHelper._instance;
    }

    private constructor() {
        // do nothing
    }

    public init(endpoint: string, info?: TraceInfo): void {
        this._tracer = new zipkin.Tracer({
            ctxImpl: new CLSContext('zipkin'),
            recorder: new zipkin.BatchRecorder({
                logger: new TransportHttp.HttpLogger({
                    endpoint: endpoint
                })
            }),
            // sample rate 0.5 will sample 1 % of all incoming requests
            sampler: new zipkin.sampler.CountingSampler(1),
        });

        this._serviceName = info.serviceName;
        this._port = info.port;
        this._remoteService = info.remoteService;
        this._initialized = true;
    }

    public setServiceName(serviceName: string): void {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }

        this._serviceName = serviceName;
    }

    public setPort(port: number): void {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }

        this._port = port;
    }

    public setRemoteService(remoteService: RemoteTraceInfo): void {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }

        this._remoteService = remoteService;
    }

    public getTraceInfo(): TraceInfo {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }

        return {
            serviceName: this._serviceName,
            remoteService: this._remoteService,
            port: this._port
        };
    }

    public getTracer(): zipkin.Tracer {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }

        return this._tracer;
    }
}