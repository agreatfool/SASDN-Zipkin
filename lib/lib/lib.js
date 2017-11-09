"use strict";
///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const grpc = require("grpc");
const url = require("url");
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
function replaceRecordBinaryKey(str) {
    return str.replace(/\./g, '_');
}
exports.replaceRecordBinaryKey = replaceRecordBinaryKey;
function formatRequestUrl(req) {
    const parsed = url.parse(req.originalUrl);
    return url.format({
        protocol: req.protocol,
        host: req.header['host'],
        pathname: parsed.pathname,
        search: parsed.search
    });
}
exports.formatRequestUrl = formatRequestUrl;
function replaceArguments(argus, metadata, callback) {
    let i = 0;
    if (argus.length == 0) {
        argus[i] = metadata;
        argus.length++;
    }
    else {
        const oldArguments = Object.assign({}, argus);
        for (let key in oldArguments) {
            if (typeof oldArguments[key] == 'function') {
                argus[i] = callback(oldArguments[key]);
            }
            else {
                argus[i] = oldArguments[key];
            }
            if (parseInt(key) == 0) {
                i++;
                argus[i] = metadata;
                argus.length++;
            }
            i++;
        }
    }
    return argus;
}
exports.replaceArguments = replaceArguments;
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
    function makeMetadata(traceId) {
        const metadata = new grpc.Metadata();
        metadata.add(zipkin.HttpHeaders.TraceId, traceId.traceId);
        metadata.add(zipkin.HttpHeaders.ParentSpanId, traceId.parentId);
        metadata.add(zipkin.HttpHeaders.SpanId, traceId.spanId);
        metadata.add(zipkin.HttpHeaders.Sampled, traceId.sampled.getOrElse() ? '1' : '0');
        return metadata;
    }
    GrpcMetadata.makeMetadata = makeMetadata;
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
