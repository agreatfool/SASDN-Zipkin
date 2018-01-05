"use strict";
///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
function replaceDotToUnderscore(str) {
    return str.replace(/\./g, '_');
}
exports.replaceDotToUnderscore = replaceDotToUnderscore;
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
