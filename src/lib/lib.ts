///<reference path="../../node_modules/grpc-tsd/src/grpc.d.ts"/>

import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import {Request as KoaRequest} from 'koa';

export function replaceDotToUnderscore(str: string) {
    return str.replace(/\./g, '_');
}

/**
 * 根据 isChild 判断是创建一个 child TraceId 还是创建一个全新的 TraceId。
 * <pre>
 * 当前节点是一个 grpc 服务器或 koa 服务器，
 * 当服务器接收到请求时，从请求上下文的 metadata 或 header 检查 traceId 和 spanId 是否存在，
 * 如果存在，则说明当前节点是一个子节点，isChild = true。
 * </pre>
 *
 * @param {zipkin.Tracer} tracer
 * @param {boolean} isChild
 * @param {(name: string) => any} getValue
 * @returns {zipkin.TraceId}
 */
export function createTraceId(tracer: zipkin.Tracer, isChild: boolean, getValue: (name: string) => any): zipkin.TraceId {

    tracer.setId(isChild ? tracer.createChildId() : tracer.createRootId());
    /*if (isChild) {
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
                flags: 0,
            });
            tracer.setId(rootIdWithFlags);
        } else {
            tracer.setId(rootId);
        }
    }*/

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