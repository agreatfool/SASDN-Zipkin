import * as zipkin from 'zipkin';
import * as url from 'url';
import {Context as KoaContext, Request as KoaRequest} from 'koa';
import {ZipkinBase, Middleware} from './abstract/ZipkinBase';
import * as lib from '../lib/lib';
import {TracerHelper} from '../TracerHelper';

export class KoaImpl extends ZipkinBase {

    public createMiddleware(): Middleware {
        const tracer = TracerHelper.instance().getTracer();
        if (tracer === null) {
            return async (ctx: KoaContext, next: () => Promise<any>) => {
                await next();
            };
        }

        return async (ctx: KoaContext, next: () => Promise<any>) => {
            const req = ctx.request;
            const res = ctx.response;

            const traceId = lib.createTraceId(
                lib.HttpHeader.containsRequired(req),
                lib.HttpHeader.getValue(req, zipkin.HttpHeaders.Flags),
                tracer,
                (name: string) => {
                    const value = lib.HttpHeader.getValue(req, name);
                    return lib.buildZipkinOption(value);
                }
            );
            ctx[zipkin.HttpHeaders.TraceId] = traceId;

            this.loggerServerReceive(traceId, req.method.toUpperCase(), {
                'http_url': this.formatRequestUrl(req)
            });

            await next();

            this.loggerServerSend(traceId, {
                'http_status_code': res.status.toString()
            });
        };
    }

    public createClient<T>(client: T, ctx?: object): T {
        throw new Error('Only the client type instrumentation are allowed to use createClient!');
    }

    private formatRequestUrl(req: KoaRequest): string {
        const parsed = url.parse(req.originalUrl);
        return url.format({
            protocol: req.protocol,
            host: req.header['host'],
            pathname: parsed.pathname,
            search: parsed.search
        });
    }
}