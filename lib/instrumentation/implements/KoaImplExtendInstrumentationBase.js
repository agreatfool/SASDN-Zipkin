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
const InstrumentationBase_1 = require("../InstrumentationBase");
const lib = require("../../lib/lib");
const Trace = require("../../Trace");
class KoaImplExtendInstrumentationBase extends InstrumentationBase_1.InstrumentationBase {
    createMiddleware() {
        if (this.info.tracer === false) {
            return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                yield next();
            });
        }
        // Set value
        const tracer = this.info.tracer;
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.request;
            const res = ctx.response;
            const traceId = Trace.createTraceId(lib.HttpHeader.containsRequired(req), lib.HttpHeader.getValue(req, zipkin.HttpHeaders.Flags), tracer, (name) => {
                const value = lib.HttpHeader.getValue(req, name);
                return Trace.buildZipkinOption(value);
            });
            tracer.setId(traceId);
            ctx[zipkin.HttpHeaders.TraceId] = traceId;
            this.loggerServerReceive(traceId, req.method.toUpperCase(), {
                'http_url': lib.formatRequestUrl(req)
            });
            yield next();
            this.loggerServerSend(traceId, {
                'http_status_code': res.status.toString()
            });
        });
    }
    createClient(client, ctx) {
        throw new Error('Only the client type instrumentation are allowed to use createClient!');
    }
}
exports.KoaImplExtendInstrumentationBase = KoaImplExtendInstrumentationBase;
