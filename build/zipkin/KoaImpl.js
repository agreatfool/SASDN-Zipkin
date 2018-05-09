"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const zipkin = require("zipkin");
const url = require("url");
const lib = require("../lib/lib");
const ZipkinBase_1 = require("./abstract/ZipkinBase");
const Trace_1 = require("../Trace");
class KoaImpl extends ZipkinBase_1.ZipkinBase {
    createMiddleware() {
        const tracer = Trace_1.Trace.instance.tracer;
        const enabled = (process.env.TRACE_ENABLED || '1') === '1';
        if (tracer === null || !enabled) {
            return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                yield next();
            });
        }
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.request;
            const res = ctx.response;
            const traceId = lib.createTraceId(tracer, lib.HttpHeader.containsRequired(req), (name) => lib.HttpHeader.getValue(req, name));
            ctx[zipkin.HttpHeaders.TraceId] = traceId;
            this._logServerReceive(traceId, req.method.toUpperCase(), {
                'http_url': this._formatRequestUrl(req)
            });
            yield next();
            this._logServerSend(traceId, {
                'http_status_code': res.status.toString()
            });
        });
    }
    createClient(client, ctx) {
        throw new Error('Only the client type instrumentation are allowed to use createClient!');
    }
    _formatRequestUrl(req) {
        const parsed = url.parse(req.originalUrl);
        return url.format({
            protocol: req.protocol,
            host: req.header['host'],
            pathname: parsed.pathname,
            search: parsed.search
        });
    }
}
exports.KoaImpl = KoaImpl;
