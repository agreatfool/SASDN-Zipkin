"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const TransportKafka = require("zipkin-transport-kafka");
const CLSContext = require("zipkin-context-cls");
class Trace {
    static get instance() {
        if (Trace._instance === undefined) {
            Trace._instance = new Trace();
        }
        return Trace._instance;
    }
    constructor() {
        this._tracer = undefined;
        this._currentServiceInfo = undefined;
        this._receiverServiceInfo = undefined;
    }
    /**
     * 初始化 Trace 的基础数据
     *
     * @param {string} url 这个参数代表 zipkin collector api 的 url 地址。
     * @param {ServiceInfo} serviceInfo
     */
    init(url, serviceInfo) {
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
    get tracer() {
        return this._tracer;
    }
    get currentServiceInfo() {
        return this._currentServiceInfo;
    }
    get receiverServiceInfo() {
        return this._receiverServiceInfo;
    }
    set receiverServiceInfo(serviceInfo) {
        this._receiverServiceInfo = serviceInfo;
    }
}
exports.Trace = Trace;
