import * as zipkin from 'zipkin';
import * as TransportHttp from 'zipkin-transport-http';
import * as CLSContext from 'zipkin-context-cls';
import * as lib from './lib/lib';

export function buildZipkinOption(value: any): zipkin.Option {
    if (value != null) {
        return new zipkin.option.Some(value);
    } else {
        return zipkin.option.None;
    }
}

export function createTracer(endpoint: string, sampler: number = 1): zipkin.Tracer {
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

export function createTraceId(isChildNode: boolean, flag: any, tracer: zipkin.Tracer, zipkinOption: (name: string) => zipkin.Option): zipkin.TraceId {
    if (isChildNode) {
        const spanId = zipkinOption(zipkin.HttpHeaders.SpanId);
        spanId.ifPresent((sid: zipkin.spanId) => {
            const childId =  new zipkin.TraceId({
                traceId: zipkinOption(zipkin.HttpHeaders.TraceId),
                parentId: zipkinOption(zipkin.HttpHeaders.ParentSpanId),
                spanId: sid,
                sampled: zipkinOption(zipkin.HttpHeaders.Sampled).map(lib.stringToBoolean),
                flags: zipkinOption(zipkin.HttpHeaders.Flags).flatMap(lib.stringToIntOption).getOrElse(0)
            });
            tracer.setId(childId);
        });
    } else {
        const rootId = tracer.createRootId();
        if (flag) {
            const rootIdWithFlags = new zipkin.TraceId({
                traceId: rootId.traceId,
                parentId: rootId.parentId,
                spanId: rootId.spanId,
                sampled: rootId.sampled,
                flags: zipkinOption(zipkin.HttpHeaders.Flags)
            });
            tracer.setId(rootIdWithFlags);
        } else {
            tracer.setId(rootId);
        }
    }

    return tracer.id;
}