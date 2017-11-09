import * as zipkin from 'zipkin';
import {MiddlewareNext} from 'sasdn';
import {Context as KoaContext} from 'koa';
import {InstrumentationBase} from '../InstrumentationBase';
import * as lib from '../../lib/lib';
import * as Trace from '../../Trace';

export class KoaImplExtendInstrumentationBase extends InstrumentationBase {

    public createMiddleware() {
        if (this.info.tracer === false) {
            return async (ctx: KoaContext, next: MiddlewareNext) => {
                await next();
            };
        }

        // Set value
        const tracer = this.info.tracer as zipkin.Tracer;

        return async (ctx: KoaContext, next: MiddlewareNext) => {

            const req = ctx.request;
            const res = ctx.response;

            const traceId = Trace.createTraceId(
                lib.HttpHeader.containsRequired(req),
                lib.HttpHeader.getValue(req, zipkin.HttpHeaders.Flags),
                tracer,
                (name: string) => {
                    const value = lib.HttpHeader.getValue(req, name);
                    return Trace.buildZipkinOption(value);
                }
            );

            tracer.setId(traceId);
            ctx[zipkin.HttpHeaders.TraceId] = traceId;

            this.loggerServerReceive(traceId, req.method.toUpperCase(), {
                'http_url': lib.formatRequestUrl(req)
            });

            await next();

            this.loggerServerSend(traceId, {
                'http_status_code': res.status.toString()
            });
        };
    }

    public createClient<T>(client: T, ctx?: KoaContext): T {
        throw new Error('Only the client type instrumentation are allowed to use createClient!');
    }
}