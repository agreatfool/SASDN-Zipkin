import * as zipkin from 'zipkin';
import { Middleware as KoaMiddleware } from 'koa';
import { RpcMiddleware } from 'sasdn';
import * as lib from '../../lib/lib';
import { ServiceInfo, Trace } from '../../Trace';

interface RecordMap {
  [key: string]: string;
}

export enum ZIPKIN_EVENT {
  SERVER_RECV = 'ServerReceive',
  SERVER_SEND = 'ServerSend',
  CLIENT_SEND = 'ClientSend',
  CLIENT_RECV = 'ClientReceive'
}

export abstract class ZipkinBase {

  private _customizedSRRecords: RecordMap;
  private _customizedSSRecords: RecordMap;
  private _customizedCSRecords: RecordMap;
  private _customizedCRRecords: RecordMap;

  public constructor() {
    this._customizedSRRecords = {};
    this._customizedSSRecords = {};
    this._customizedCSRecords = {};
    this._customizedCRRecords = {};
  }

  /**
   * 初始化 Trace 数据
   *
   * @param {string} url Zipkin Collector API url.
   * @param {ServiceInfo} serviceInfo
   */
  public static init(url: string, serviceInfo: ServiceInfo): void {
    Trace.instance.init(url, serviceInfo);
  };

  /**
   * 更新 Trace 的 Receiver 数据
   *
   * @param {ServiceInfo} serviceInfo
   */
  public static setReceiverServiceInfo(serviceInfo: ServiceInfo): void {
    Trace.instance.receiverServiceInfo = serviceInfo;
  }

  /**
   * 添加自定义的 RecordMap
   *
   * @param {ZIPKIN_EVENT.SERVER_RECV | ZIPKIN_EVENT.SERVER_SEND | ZIPKIN_EVENT.CLIENT_SEND | ZIPKIN_EVENT.CLIENT_RECV} event
   * @param {RecordMap} records
   */
  public setCustomizedRecords(event: ZIPKIN_EVENT.SERVER_RECV | ZIPKIN_EVENT.SERVER_SEND | ZIPKIN_EVENT.CLIENT_SEND | ZIPKIN_EVENT.CLIENT_RECV, records: RecordMap): void {
    switch (event) {
      case ZIPKIN_EVENT.SERVER_RECV:
        this._customizedSRRecords = records;
        break;
      case ZIPKIN_EVENT.SERVER_SEND:
        this._customizedSSRecords = records;
        break;
      case ZIPKIN_EVENT.CLIENT_SEND:
        this._customizedCSRecords = records;
        break;
      case ZIPKIN_EVENT.CLIENT_RECV:
        this._customizedCRRecords = records;
        break;
    }
  }

  /**
   * 创建服务器中间件
   *
   * @returns {Middleware}
   */
  public abstract createMiddleware(): RpcMiddleware | KoaMiddleware;

  /**
   * 创建代理客户端
   *
   * @param {T} client
   * @param {Object} ctx
   * @returns {T}
   */
  public abstract createClient<T>(client: T, ctx?: object): T;

  /**
   * 记录 Zipkin ServerRecv 事件
   *
   * @param {zipkin.TraceId} traceId
   * @param {string} method
   * @param {RecordMap} records
   * @private
   */
  protected _logServerReceive(traceId: zipkin.TraceId, method: string, records: RecordMap = {}) {
    const tracer = Trace.instance.tracer;
    const { serviceName, host, port } = Trace.instance.currentServiceInfo;

    tracer.scoped(() => {
      tracer.setId(traceId);

      for (const key in this._customizedSRRecords) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedSRRecords[key]);
      }

      for (const key in records) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
      }

      tracer.recordServiceName(serviceName || 'unknown');
      tracer.recordRpc(method);
      tracer.recordAnnotation(new zipkin.Annotation.ServerRecv());
      tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({
        host: (host) ? new zipkin.InetAddress(host) : null,
        port: port || 0
      }));

      if (traceId.flags !== 0 && traceId.flags != null) {
        tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
      }

      this._customizedSRRecords = {};
    });
  };

  /**
   * 记录 Zipkin ServerSend 事件
   *
   * @param {zipkin.TraceId} traceId
   * @param {RecordMap} records
   * @private
   */
  protected _logServerSend(traceId: zipkin.TraceId, records: RecordMap = {}): void {
    const tracer = Trace.instance.tracer;

    tracer.scoped(() => {
      tracer.setId(traceId);

      for (const key in this._customizedSSRecords) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedSSRecords[key]);
      }

      for (const key in records) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
      }

      tracer.recordAnnotation(new zipkin.Annotation.ServerSend());

      this._customizedSSRecords = {};
    });
  };

  /**
   * 记录 Zipkin Client Send 事件
   *
   * @param {zipkin.TraceId} traceId
   * @param {string} method
   * @param {RecordMap} records
   * @private
   */
  protected _logClientSend(traceId: zipkin.TraceId, method: string, records: RecordMap = {}): void {
    const tracer = Trace.instance.tracer;
    const { serviceName, host, port } = Trace.instance.currentServiceInfo;

    tracer.scoped(() => {
      tracer.setId(traceId);

      for (const key in this._customizedCSRecords) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedCSRecords[key]);
      }

      for (const key in records) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
      }

      tracer.recordServiceName(serviceName || 'unknown');
      tracer.recordRpc(method);
      tracer.recordAnnotation(new zipkin.Annotation.ClientSend());
      tracer.recordAnnotation(new zipkin.Annotation.LocalAddr({
        host: (host) ? new zipkin.InetAddress(host) : null,
        port: port || 0
      }));

      const receiverServiceInfo = Trace.instance.receiverServiceInfo;
      if (receiverServiceInfo) {
        tracer.recordAnnotation(new zipkin.Annotation.ServerAddr({
          serviceName: receiverServiceInfo.serviceName || 'unknown',
          host: (receiverServiceInfo.host) ? new zipkin.InetAddress(receiverServiceInfo.host) : null,
          port: receiverServiceInfo.port || 0
        }));
      }

      if (traceId.flags && traceId.flags !== 0) {
        tracer.recordBinary(zipkin.HttpHeaders.Flags, traceId.flags);
      }

      this._customizedCSRecords = {};
    });
  };

  /**
   * 记录 Zipkin Client Recv 事件
   *
   * @param {zipkin.TraceId} traceId
   * @param {RecordMap} records
   * @private
   */
  protected _logClientReceive(traceId: zipkin.TraceId, records: RecordMap = {}): void {
    const tracer = Trace.instance.tracer;

    tracer.scoped(() => {
      tracer.setId(traceId);

      for (const key in this._customizedCRRecords) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), this._customizedCRRecords[key]);
      }

      for (const key in records) {
        tracer.recordBinary(lib.replaceDotToUnderscore(key), records[key]);
      }

      tracer.recordAnnotation(new zipkin.Annotation.ClientRecv());

      this._customizedCRRecords = {};
    });
  };

}