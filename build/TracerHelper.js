"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const TransportHttp = require("zipkin-transport-http");
const CLSContext = require("zipkin-context-cls");
class TracerHelper {
    constructor() {
        this._initialized = false;
        this._tracer = null;
        this._serviceName = 'unknown';
        this._remoteService = {};
        this._port = 0;
        // do nothing
    }
    static instance() {
        if (TracerHelper._instance === undefined) {
            TracerHelper._instance = new TracerHelper();
        }
        return TracerHelper._instance;
    }
    init(endpoint, info) {
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
    setServiceName(serviceName) {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }
        this._serviceName = serviceName;
    }
    setPort(port) {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }
        this._port = port;
    }
    setRemoteService(remoteService) {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }
        this._remoteService = remoteService;
    }
    getTraceInfo() {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }
        return {
            serviceName: this._serviceName,
            remoteService: this._remoteService,
            port: this._port
        };
    }
    getTracer() {
        if (!this._initialized) {
            throw new Error('TracerHelper instance has not initialized!');
        }
        return this._tracer;
    }
}
exports.TracerHelper = TracerHelper;
