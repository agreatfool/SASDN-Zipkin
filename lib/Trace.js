"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const TransportHttp = require("zipkin-transport-http");
const CLSContext = require("zipkin-context-cls");
const lib = require("./lib/lib");
function buildZipkinOption(value) {
    if (value != null) {
        return new zipkin.option.Some(value);
    }
    else {
        return zipkin.option.None;
    }
}
exports.buildZipkinOption = buildZipkinOption;
function createTracer(endpoint, sampler = 1) {
    return new zipkin.Tracer({
        ctxImpl: new CLSContext('zipkin'),
        recorder: new zipkin.BatchRecorder({
            logger: new TransportHttp.HttpLogger({
                endpoint: endpoint
            })
        }),
        // sample rate 0.5 will sample 1 % of all incoming requests
        sampler: new zipkin.sampler.CountingSampler(sampler),
    });
}
exports.createTracer = createTracer;
function createTraceId(isChildNode, flag, tracer, zipkinOption) {
    if (isChildNode) {
        const spanId = zipkinOption(zipkin.HttpHeaders.SpanId);
        spanId.ifPresent((sid) => {
            return new zipkin.TraceId({
                traceId: zipkinOption(zipkin.HttpHeaders.TraceId),
                parentId: zipkinOption(zipkin.HttpHeaders.ParentSpanId),
                spanId: sid,
                sampled: zipkinOption(zipkin.HttpHeaders.Sampled).map(lib.stringToBoolean),
                flags: zipkinOption(zipkin.HttpHeaders.Flags).flatMap(lib.stringToIntOption).getOrElse(0)
            });
        });
    }
    else {
        const rootId = tracer.createRootId();
        if (flag) {
            return new zipkin.TraceId({
                traceId: rootId.traceId,
                parentId: rootId.parentId,
                spanId: rootId.spanId,
                sampled: rootId.sampled,
                flags: zipkinOption(zipkin.HttpHeaders.Flags)
            });
        }
        else {
            return rootId;
        }
    }
}
exports.createTraceId = createTraceId;
