///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import {Request as KoaRequest} from 'koa';

export function replaceDotToUnderscore(str: string) {
    return str.replace(/\./g, '_');
}

export namespace GrpcMetadata {
    export function getValue(metadata: grpc.Metadata, metaName: string): string | Buffer {
        // metadata.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return metadata.get(metaName)[0];
    }

    export function containsRequired(metadata: grpc.Metadata): boolean {
        return getValue(metadata, zipkin.HttpHeaders.TraceId) !== undefined
            && getValue(metadata, zipkin.HttpHeaders.SpanId) !== undefined;
    }
}

export namespace HttpHeader {
    export function getValue(req: KoaRequest, headerName: string): string {
        // req.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return req.get(headerName);
    }

    export function containsRequired(req: KoaRequest): boolean {
        return getValue(req, zipkin.HttpHeaders.TraceId) !== ''
            && getValue(req, zipkin.HttpHeaders.SpanId) !== '';
    }
}