"use strict";
///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
function replaceDotToUnderscore(str) {
    return str.replace(/\./g, '_');
}
exports.replaceDotToUnderscore = replaceDotToUnderscore;
function stringToInt(str) {
    return parseInt(str);
}
exports.stringToInt = stringToInt;
function booleanToString(bool) {
    return bool ? '1' : '0';
}
exports.booleanToString = booleanToString;
function buildZipkinOption(value) {
    if (value != null) {
        return new zipkin.option.Some(value);
    }
    else {
        return zipkin.option.None;
    }
}
exports.buildZipkinOption = buildZipkinOption;
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
                sampled: getZipkinOption(zipkin.HttpHeaders.Sampled),
                flags: getZipkinOption(zipkin.HttpHeaders.Flags).flatMap(stringToInt).getOrElse(0)
            });
            tracer.setId(childId);
        });
    }
    else {
        const rootId = tracer.createRootId();
        if (getValue(zipkin.HttpHeaders.Flags)) {
            const rootIdWithFlags = new zipkin.TraceId({
                traceId: getZipkinOption(rootId.traceId),
                parentId: getZipkinOption(rootId.parentId),
                spanId: rootId.spanId,
                sampled: rootId.sampled.map(booleanToString),
                flags: getZipkinOption(zipkin.HttpHeaders.Flags).flatMap(stringToInt).getOrElse(0)
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
    function getValue(metadata, metaName) {
        // metadata.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return metadata.get(metaName)[0];
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
