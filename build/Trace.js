"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const TransportFile = require("zipkin-transport-file");
const TransportHttp = require("zipkin-transport-http");
const TransportKafka = require("zipkin-transport-kafka");
const CLSContext = require("zipkin-context-cls");
const LibPath = require("path");
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
     * @param {ServiceInfo} serviceInfo
     */
    init(serviceInfo) {
        const infoDefaults = {
            transType: 'FILE',
            filePath: LibPath.join(__dirname, 'zipkin.log')
        };
        const infoOpts = Object.assign({}, infoDefaults, serviceInfo || {});
        this._tracer = new zipkin.Tracer({
            ctxImpl: new CLSContext(),
            recorder: new zipkin.BatchRecorder({
                logger: this._genLogger(serviceInfo)
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
    _genLogger(info) {
        switch (info.transType) {
            case 'FILE':
                return new TransportFile.FileLogger({
                    filePath: info.filePath
                });
            case 'KAFKA':
                return new TransportKafka.KafkaLogger({
                    clientOpts: {
                        kafkaHost: info.url
                    }
                });
            case 'HTTP':
                return new TransportHttp.HttpLogger({
                    endpoint: info.url
                });
            default:
                return new TransportFile.FileLogger({
                    filePath: info.filePath
                });
        }
    }
}
exports.Trace = Trace;
