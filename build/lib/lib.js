"use strict";
///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
function stringToBoolean(str) {
    return str === '1';
}
exports.stringToBoolean = stringToBoolean;
function stringToIntOption(str) {
    try {
        return new zipkin.option.Some(parseInt(str));
    }
    catch (err) {
        return zipkin.option.None;
    }
}
exports.stringToIntOption = stringToIntOption;
function replaceDotToUnderscore(str) {
    return str.replace(/\./g, '_');
}
exports.replaceDotToUnderscore = replaceDotToUnderscore;
function buildZipkinOption(value) {
    if (value != null) {
        return new zipkin.option.Some(value);
    }
    else {
        return zipkin.option.None;
    }
}
exports.buildZipkinOption = buildZipkinOption;
/**
 * 根据外部数据（头信息或元数据）创建一个 child traceId。
 * 如果外部数据不存在，则创建一个全新的 traceId。
 *
 * @param {zipkin.Tracer} tracer
 * @param {boolean} isChild
 * @param {(name: string) => any} getValue
 * @returns {zipkin.TraceId}
 */
function createTraceId(tracer, isChild, getValue) {
    function getZipkinOption(name) {
        return buildZipkinOption(getValue(name));
    }
    if (isChild) {
        const spanId = getZipkinOption(zipkin.HttpHeaders.SpanId);
        spanId.ifPresent((sid) => {
            const childId = new zipkin.TraceId({
                traceId: getZipkinOption(zipkin.HttpHeaders.TraceId),
                parentId: getZipkinOption(zipkin.HttpHeaders.ParentSpanId),
                spanId: sid,
                sampled: getZipkinOption(zipkin.HttpHeaders.Sampled).map(stringToBoolean),
                flags: getZipkinOption(zipkin.HttpHeaders.Flags).flatMap(stringToIntOption).getOrElse(0)
            });
            tracer.setId(childId);
        });
    }
    else {
        const rootId = tracer.createRootId();
        if (getValue(zipkin.HttpHeaders.Flags)) {
            const rootIdWithFlags = new zipkin.TraceId({
                traceId: rootId.traceId,
                parentId: rootId.parentId,
                spanId: rootId.spanId,
                sampled: rootId.sampled,
                flags: getZipkinOption(zipkin.HttpHeaders.Flags)
            });
            tracer.setId(rootIdWithFlags);
        }
        else {
            tracer.setId(rootId);
        }
    }
    return tracer.id;
}
exports.createTraceId = createTraceId;
var GrpcMetadata;
(function (GrpcMetadata) {
    function getValue(metadata, headerName) {
        // metadata.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return metadata.get(headerName)[0];
    }
    GrpcMetadata.getValue = getValue;
    function containsRequired(metadata) {
        return getValue(metadata, zipkin.HttpHeaders.TraceId) !== undefined
            && getValue(metadata, zipkin.HttpHeaders.SpanId) !== undefined;
    }
    GrpcMetadata.containsRequired = containsRequired;
})(GrpcMetadata = exports.GrpcMetadata || (exports.GrpcMetadata = {}));
var HttpHeader;
(function (HttpHeader) {
    function getValue(req, headerName) {
        // req.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return req.get(headerName);
    }
    HttpHeader.getValue = getValue;
    function containsRequired(req) {
        return getValue(req, zipkin.HttpHeaders.TraceId) !== ''
            && getValue(req, zipkin.HttpHeaders.SpanId) !== '';
    }
    HttpHeader.containsRequired = containsRequired;
})(HttpHeader = exports.HttpHeader || (exports.HttpHeader = {}));
