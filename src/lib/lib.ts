import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import { Request as KoaRequest } from 'koa';

export function replaceDotToUnderscore(str: string) {
  return str.replace(/\./g, '_');
}

export function stringToInt(str: string): number {
  return parseInt(str);
}

export function booleanToString(bool: boolean): string {
  return bool ? '1' : '0';
}

export function buildZipkinOption<T>(value: T): zipkin.option.IOption<T> {
  if (value) {
    return new zipkin.option.Some(value);
  } else {
    return zipkin.option.None;
  }
}

export function createTraceId(tracer: zipkin.Tracer, isChild: boolean, getValue: (name: string) => any): zipkin.TraceId {

  function getZipkinOption(name: string): zipkin.option.IOption<string> {
    return buildZipkinOption(getValue(name));
  }

  if (isChild) {
    const spanId = getZipkinOption(zipkin.HttpHeaders.SpanId);
    spanId.ifPresent((sid: string) => {
      const childId = new zipkin.TraceId({
        traceId: getZipkinOption(zipkin.HttpHeaders.TraceId),
        parentId: getZipkinOption(zipkin.HttpHeaders.ParentSpanId),
        spanId: sid,
        sampled: getZipkinOption(zipkin.HttpHeaders.Sampled),
        flags: getZipkinOption(zipkin.HttpHeaders.Flags).flatMap(stringToInt).getOrElse(0)
      });
      tracer.setId(childId);
    });
  } else {
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