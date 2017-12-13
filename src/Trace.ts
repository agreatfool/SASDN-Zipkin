import * as zipkin from 'zipkin';
import * as TransportKafka from 'zipkin-transport-kafka';
import * as CLSContext from 'zipkin-context-cls';

export interface ServiceInfo {
    serviceName?: string;
    host?: string;
    port?: number;
}

export class Trace {
    private static _instance: Trace;

    private _tracer: zipkin.Tracer;
    // 当前微服务的信息，在 Trace.init() 时设定后，并不需要更改.
    private _currentServiceInfo: ServiceInfo;
    // 如果当前微服务需要向外部发起请求，则需要通过 Trace.setReceiverTraceInfo() 进行数据的更改，将外部服务的信息填写进来。
    private _receiverServiceInfo: ServiceInfo;

    public static get instance(): Trace {
        if (Trace._instance === undefined) {
            Trace._instance = new Trace();
        }
        return Trace._instance;
    }

    private constructor() {
        this._tracer = undefined;
        this._currentServiceInfo = undefined;
        this._receiverServiceInfo = undefined;
    }

    /**
     * 初始化 Trace 的基础数据
     *
     * @param {string} url 这个参数代表 kafka collector api 的 url 地址。
     * @param {ServiceInfo} serviceInfo
     */
    public init(url: string, serviceInfo: ServiceInfo): void {
        this._tracer = new zipkin.Tracer({
            ctxImpl: new CLSContext(),
            recorder: new zipkin.BatchRecorder({
                logger: new TransportKafka.KafkaLogger({
                    clientOpts: {
                        kafkaHost: url
                    }
                })
            }),
            sampler: new zipkin.sampler.CountingSampler(1),
        });
        this._currentServiceInfo = serviceInfo;
    }

    public get tracer(): zipkin.Tracer {
        return this._tracer;
    }

    public get currentServiceInfo(): ServiceInfo {
        return this._currentServiceInfo;
    }

    public get receiverServiceInfo(): ServiceInfo {
        return this._receiverServiceInfo;
    }

    public set receiverServiceInfo(serviceInfo: ServiceInfo) {
        this._receiverServiceInfo = serviceInfo;
    }
}