///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
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

export function replaceDotToUnderscore(str: string) {
    return str.replace(/\./g, '_');
}

export function buildZipkinOption(value: any): zipkin.Option {
    if (value != null) {
        return new zipkin.option.Some(value);
    } else {
        return zipkin.option.None;
    }
}

/**
 * 根据外部数据（头信息或元数据）创建一个 child traceId。
 * 如果外部数据不存在，则创建一个全新的 traceId。
 *
 * @param {zipkin.Tracer} tracer
 * @param {boolean} isChild
 * @param {(name: string) => any} getValue
 * @returns {zipkin.TraceId}
 */
export function createTraceId(tracer: zipkin.Tracer, isChild: boolean, getValue: (name: string) => any): zipkin.TraceId {

    function getZipkinOption(name: string): zipkin.Option {
        return buildZipkinOption(getValue(name));
    }

    if (isChild) {
        const spanId = getZipkinOption(zipkin.HttpHeaders.SpanId);
        spanId.ifPresent((sid: zipkin.spanId) => {
            const childId = new zipkin.TraceId({
                traceId: getZipkinOption(zipkin.HttpHeaders.TraceId),
                parentId: getZipkinOption(zipkin.HttpHeaders.ParentSpanId),
                spanId: sid,
                sampled: getZipkinOption(zipkin.HttpHeaders.Sampled).map(stringToBoolean),
                flags: getZipkinOption(zipkin.HttpHeaders.Flags).flatMap(stringToIntOption).getOrElse(0)
            });
            tracer.setId(childId);
        });
    } else {
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
        } else {
            tracer.setId(rootId);
        }
    }

    return tracer.id;
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