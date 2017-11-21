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

> SASDN-Zipkin 允许用户在 trace 日志中添加自定义数据，但是为服务端添加自定义数据与为客户端添加自定义数据两种方案，他们执行顺序和触发日志发送的时机是完全不一样的，下面就开始介绍如何添加自定义数据。

#### 为服务端添加自定义数据

通过上面的代码，可以知道服务端是通过 middleware 的方式添加 zipkin trace 的，所以为服务端添加自定义数的操作必须是在 middleware 触发之前的。通常这些日志都是全局的，每个请求都需要进行记录。

##### 在 grpc server 的 zipkin trace 记录添加自定义数据：请求中的元数据

```typescript
import {RpcApplication} from 'sasdn';
import {GrpcImpl, ZIPKIN_EVENT} from 'sasdn-zipkin';

const zipkinImpl = new GrpcImpl();
GrpcImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
  serviceName: 'ms-user',
  port: 0
});

const app = new RpcApplication();
app.use(async (ctx, next) => {
  // 在 Zipkin Event：Server Receive 时，记录请求中的元数据
  zipkinImpl.setCustomizedRecords(ZIPKIN_EVENT.SERVER_RECV, {
    metadata: JSON.stringify(ctx.call.metadata.getMap()) // 自定义数据的 value 值的类型必须是 string
  });
  await next();
})
app.use(zipkinTmpl.createMiddleware());
app.bind(`127.0.0.1:8080`).start();
```

##### 在 koa server 的 zipkin trace 记录中添加自定义数据：接口返回状态码

```typescript
import * as Koa from 'koa';
import {KoaImpl} from 'sasdn-zipkin';

const zipkinImpl = new KoaImpl();
KoaImpl.init(`http://127.0.0.1:9411/api/v1/spans`, {
  serviceName: 'ms-user',
  port: 0
});

const app = new Koa();
app.use(zipkinImpl.createMiddleware());
app.use(async (ctx, next) => {
  // 在 Zipkin Event：Server Send 中，记录请求返回状态码
  zipkinImpl.setCustomizedRecords(ZIPKIN_EVENT.SERVER_SEND, {
    httpCode: ctx.response.status.toString()// 自定义数据的 value 值的类型必须是 string
  });
  await next();
})
app.listen(`127.0.0.1`, 8080);
```

#### 为客户端添加自定义数据

为客户端添加自定义数据的方式相对简单，只需要在 createClient 后，执行 Client 的远程调用前，将自定义数据通过 setCustomizedRecords 方法加入到缓存中即可。

##### 在 grpc client的 zipkin trace 记录添加自定义数据：当前时间

```typescript
import {GrpcImpl, ZIPKIN_EVENT} from 'sasdn-zipkin';
import {OrderServiceClient} from './proto/order/order_grpc_pb';

const zipkinImpl = new GrpcImpl();
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
const proxyClient = zipkinImpl.createClient(grpcClient, ctx);

// 在 Zipkin Event：Client Send 时，记录当前时间
zipkinImpl.setCustomizedRecords(ZIPKIN_EVENT.CLIENT_SEND, {
    time: new Date().getTime().toString()
});

proxyClient.getOrder(request, (err: Error, res: Order) => {
  if (err) {
    throw err
  }
  console.log(res);
});
```

##### 在 typeorm client的 zipkin trace 记录添加自定义数据：日志信息
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

const zipkinImpl = new TypeOrmImpl();
const conn = await createConnection({
  type: 'sqlite',
  database: './User.db',
  entities: entities,
});
const proxyConn = zipkinImpl.createClient(conn, ctx);

// 在 Zipkin Event：Client Receive 时，记录一个字符串
zipkinImpl.setCustomizedRecords(ZIPKIN_EVENT.CLIENT_RECV, {
    log: "MS-USER > sqlite query finish!"
});
const userEntity = await proxyConn.getRepository(UserEntity)
	.createQueryBuilder('user')
	.where(`user.id=:id`, {id: request.getId()})
	.getOne();
```

