import * as zipkin from 'zipkin';
import * as grpc from 'grpc';
import { RpcMiddleware } from 'sasdn';
import { ZipkinBase } from './abstract/ZipkinBase';
import * as lib from '../lib/lib';
import { Trace } from '../Trace';

export declare class GrpcContext {
  call: grpc.IServerCall;
}

export declare type GrpcClient = grpc.Client;

type GrpcCallback = (err: Error, res: any) => void;
type ProxyGrpcCallback = (callback: GrpcCallback) => GrpcCallback;

export class GrpcImpl extends ZipkinBase {

  /**
   * 创建服务器中间件
   *
   * @returns {(ctx: GrpcContext, next: () => Promise<any>) => Promise<any>}
   */
  public createMiddleware(): RpcMiddleware {
    const tracer = Trace.instance.tracer;
    if (!tracer) {
      return async (ctx: GrpcContext, next: () => Promise<any>) => {
        await next();
      };
    }

    return async (ctx: GrpcContext, next: () => Promise<any>) => {
      const req = ctx.call.metadata;

      const traceId = lib.createTraceId(
        tracer,
        lib.GrpcMetadata.containsRequired(req),
        (name: string) => lib.GrpcMetadata.getValue(req, name),
      );
      ctx[zipkin.HttpHeaders.TraceId] = traceId;

      this._logServerReceive(traceId, 'rpc');

      await next();

      this._logServerSend(traceId);
    };
  }

  /**
   * 创建客户端中间件
   *
   * @param {GrpcClient} client
   * @param {Object} ctx
   * @returns {GrpcClient}
   */
  public createClient<GrpcClient>(client: GrpcClient, ctx?: object): GrpcClient {
    const tracer = Trace.instance.tracer;
    if (!tracer) {
      console.log('Return normal client.');
      return client;
    }

    // 判断 ctx 中是否存在 traceId，如果存在则这个代理客户端会根据 traceId 生成一个 child traceId
    if (ctx
      && ctx.hasOwnProperty(zipkin.HttpHeaders.TraceId)
      && ctx[zipkin.HttpHeaders.TraceId] instanceof zipkin.TraceId) {
      tracer.setId(ctx[zipkin.HttpHeaders.TraceId]);
    }

    // 遍历 grpcClient 中的所有方法，找到 APICall 方法并进行参数改造
    Object.getOwnPropertyNames(Object.getPrototypeOf(client)).forEach((property) => {
      const original = client[property];
      if (property != 'constructor' && typeof original == 'function') {

        function proxyGrpcCall() {
          // create SpanId
          tracer.setId(tracer.createChildId());
          const traceId = tracer.id;

          this._logClientSend(traceId, 'rpc', {
            'rpc_query': property,
            'rpc_query_params': JSON.stringify(arguments)
          });

          /**
           * 创建一个 ProxyGrpcCallback 方法用来拦截 grpcCallback，并在 grpcCallback 执行前后，增加 zipkin日志
           *
           * @param {Function} callback
           * @returns {(err: Error, res: any) => void}
           */
          const proxyGrpcCallback: ProxyGrpcCallback = (callback: GrpcCallback) => {
            return (err: Error, res: any): void => {
              if (err) {
                this._logClientReceive(traceId, {
                  'rpc_end': `Error`,
                  'rpc_end_response': err.message
                });
              } else {
                let resObj: string;
                try {
                  resObj = JSON.stringify(res);
                } catch (e) {
                  resObj = res.toString();
                }

                this._logClientReceive(traceId, {
                  'rpc_end': `Callback`,
                  'rpc_end_response': resObj
                });
              }
              callback(err, res);
            };
          };

          /**
           * argument 参数对应的是 APICall 的所有参数
           * <pre>
           *     1. { params, grpcCallback }
           *     2. { params, metadata, grpcCallback }
           * </pre>
           *
           * 参数改造后，统一变成 { params, metadata, proxyGrpcCallback }
           * params 参数维持不变
           * metadata 参数增加 traceId 相关属性
           * proxyGrpcCallback 参数是一个拦截了 grpcCallback 的方法
           */
          const argus = this._updateArgumentWithMetadata(arguments, traceId, proxyGrpcCallback);

          const call = original.apply(client, argus);

          call.on('end', () => {
            this._logClientReceive(traceId, {
              'rpc_end': `Call`,
            });
          });
        }

        client[property] = proxyGrpcCall.bind(this);
      }
    });

    return client;
  }

  private _updateArgumentWithMetadata(argus: IArguments, traceId: zipkin.TraceId, callback: ProxyGrpcCallback): Array<any> {
    // argument length is 2 or 3
    // {'0': params, '1': function callback}
    // {'0': params, '1': metadata '2': function callback}

    const metadata = (argus.length == 3) ? argus[1] : new grpc.Metadata();
    metadata.add(zipkin.HttpHeaders.TraceId, traceId.traceId);
    metadata.add(zipkin.HttpHeaders.ParentSpanId, traceId.parentId);
    metadata.add(zipkin.HttpHeaders.SpanId, traceId.spanId);
    metadata.add(zipkin.HttpHeaders.Sampled, traceId.sampled ? '1' : '0');

    return [argus[0], metadata, callback(argus.length == 2 ? argus[1] : argus[2])];
  }
}
