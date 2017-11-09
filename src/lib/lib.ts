///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as grpc from "grpc";
import * as url from 'url';
import {Request as KoaRequest} from 'koa';

export function stringToBoolean(str: string): boolean {
    return str === '1';
}

export function stringToIntOption(str: string): zipkin.Option {
    try {
        return new zipkin.option.Some(parseInt(str));
    } catch (err) {
        return zipkin.option.None;
    }
}

export function replaceRecordBinaryKey(str: string) {
    return str.replace(/\./g, '_');
}

export function formatRequestUrl(req: KoaRequest): string {
    const parsed = url.parse(req.originalUrl);
    return url.format({
        protocol: req.protocol,
        host: req.header['host'],
        pathname: parsed.pathname,
        search: parsed.search
    });
}

export function replaceArguments(argus: IArguments, metadata: grpc.Metadata, callback: Function): IArguments {
    let i = 0;
    if (argus.length == 0) {
        argus[i] = metadata;
        argus.length++;
    } else {
        const oldArguments = Object.assign({}, argus);
        for (let key in oldArguments) {
            if (typeof oldArguments[key] == 'function') {
                argus[i] = callback(oldArguments[key]);
            } else {
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

export namespace GrpcMetadata {
    export function getValue(metadata: grpc.Metadata, headerName: string): string | Buffer {
        // metadata.get() 方法本身就是不区分大小写的，eg：X-B3-TraceId 和 x-b3-traceid 可以获取相同的数据
        return metadata.get(headerName)[0];
    }

    export function containsRequired(metadata: grpc.Metadata): boolean {
        return getValue(metadata, zipkin.HttpHeaders.TraceId) !== undefined
            && getValue(metadata, zipkin.HttpHeaders.SpanId) !== undefined;
    }

    export function makeMetadata(traceId: zipkin.TraceId): grpc.Metadata {
        const metadata = new grpc.Metadata();
        metadata.add(zipkin.HttpHeaders.TraceId, traceId.traceId);
        metadata.add(zipkin.HttpHeaders.ParentSpanId, traceId.parentId);
        metadata.add(zipkin.HttpHeaders.SpanId, traceId.spanId);
        metadata.add(zipkin.HttpHeaders.Sampled, traceId.sampled.getOrElse() ? '1' : '0');
        return metadata;
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