import * as zipkin from 'zipkin';
import * as url from 'url';
import { Context as KoaContext, Middleware as KoaMiddleware, Request as KoaRequest } from 'koa';
import * as lib from '../lib/lib';
import { ZipkinBase } from './abstract/ZipkinBase';
import { Trace } from '../Trace';

export class KoaImpl extends ZipkinBase {

  public createMiddleware(): KoaMiddleware {
    const tracer = Trace.instance.tracer;
    if (tracer === null) {
      return async (ctx: KoaContext, next: () => Promise<any>) => {
        await next();
      };
    }

    return async (ctx: KoaContext, next: () => Promise<any>) => {
      const req = ctx.request;
      const res = ctx.response;

      const traceId = lib.createTraceId(
        tracer,
        lib.HttpHeader.containsRequired(req),
        (name: string) => lib.HttpHeader.getValue(req, name)
      );
      ctx[zipkin.HttpHeaders.TraceId] = traceId;

      this._logServerReceive(traceId, req.method.toUpperCase(), {
        'http_url': this._formatRequestUrl(req)
      });

      await next();

      this._logServerSend(traceId, {
        'http_status_code': res.status.toString()
      });
    };
  }

  public createClient<T>(client: T, ctx?: object): T {
    throw new Error('Only the client type instrumentation are allowed to use createClient!');
  }

  private _formatRequestUrl(req: KoaRequest): string {
    const parsed = url.parse(req.originalUrl);
    return url.format({
      protocol: req.protocol,
      host: req.header['host'],
      pathname: parsed.pathname,
      search: parsed.search
    });
  }
}