# SASDN-Zipkin

## Install

```bash
$ npm install --save sasdn-zipkin
```

## Examples

### gRPC
#### gRPC Server Middleware

```typescript
import {RpcApplication} from 'sasdn';
import {GrpcImpl} from 'sasdn-zipkin';

GrpcImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});

const app = new RpcApplication();
app.use(new GrpcImpl().createMiddleware());
app.bind(`127.0.0.1:8080`).start();
```

#### gRPC Client Proxy

```typescript
import {GrpcImpl} from 'sasdn-zipkin';
import {OrderServiceClient} from './proto/order/order_grpc_pb';

GrpcImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});
GrpcImpl.setReceiverServiceInfo({
    serviceName: 'ms-order',
    host: '127.0.0.1',
    port: 9090
});

const grpcClient = new OrderServiceClient('127.0.0.1:9090', grpc.credentials.createInsecure());
const proxyClient = new GrpcImpl().createClient(grpcClient, ctx);
```
### Koa

#### Koa Server Middleware

```typescript
import * as Koa from 'koa';
import {KoaImpl} from 'sasdn-zipkin';

KoaImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});

const app = new Koa();
app.use(new KoaImpl().createMiddleware());
app.listen(`127.0.0.1`, 8080);
```

### Typeorm

#### Typeorm Client Proxy

```typescript
import {TypeOrmImpl} from 'sasdn-zipkin';
import {User as UserEntity} from './entity/User';
import {createConnection} from 'typeorm';

// build entities
const entities = [];
entities.push({UserEntity: UserEntity});

TypeOrmImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});
TypeOrmImpl.setReceiverServiceInfo({
    serviceName: 'sqlite'
});
  
const conn = await createConnection({
    type: 'sqlite',
    database: './User.db',
    entities: entities,
});
const proxyConn = new TypeOrmImpl().createClient(conn, ctx);
```

### 在 zipkin trace 日志中添加自定义数据
#### gRPC Server Middleware

```typescript
import {RpcApplication} from 'sasdn';
import {GrpcImpl, ZIPKIN_EVENT} from 'sasdn-zipkin';

GrpcImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});

const app = new RpcApplication();
const zipkinTmpl = new GrpcImpl();

// 在Zipkin Event：Server Receive时添加自定义日志
zipkinImple.setCustomizedRecords(ZIPKIN_EVENT.SERVER_RECV, {
    test1: 'Server Receive'
});
// 在Zipkin Event：Server Send时添加自定义日志
zipkinImple.setCustomizedRecords(ZIPKIN_EVENT.SERVER_Send, {
    test2: 'Sever Send'
});

app.use(zipkinTmpl.createMiddleware());
app.bind(`127.0.0.1:8080`).start();
```

#### gRPC Client Proxy

```typescript
import {GrpcImpl, ZIPKIN_EVENT} from 'sasdn-zipkin';
import {OrderServiceClient} from './proto/order/order_grpc_pb';

GrpcImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
    serviceName: 'ms-user',
    port: 0
});
GrpcImpl.setReceiverServiceInfo({
    serviceName: 'ms-order',
    host: '127.0.0.1',
    port: 9090
});

const grpcClient = new OrderServiceClient('127.0.0.1:9090', grpc.credentials.createInsecure());
const zipkinTmpl = new GrpcImpl();

// 在Zipkin Event：Client Send时添加自定义日志
zipkinImple.setCustomizedRecords(ZIPKIN_EVENT.CLIENT_SEND, {
    test1: 'Client Send'
});
// 在Zipkin Event：Client Receive时添加自定义日志
zipkinImple.setCustomizedRecords(ZIPKIN_EVENT.CLIENT_RECV, {
    test2: 'Client Receive'
});
const proxyClient = zipkinTmpl.createClient(grpcClient, ctx);

```

