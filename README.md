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

GrpcImpl.initTracerInfo(`http://127.0.0.1:9411/api/v1/spans`, {
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

GrpcImpl.setTracerInfo({
  remoteService: {
    serviceName: 'ms-user',
    host: '127.0.0.1',
    port: 9090
  }
});

const grpcClient = new OrderServiceClient('127.0.0.1:9090', grpc.credentials.createInsecure());
const proxyClient = new GrpcImpl().createClient(grpcClient, ctx);
```
### Koa

#### Koa Server Middleware

```typescript
import * as Koa from 'koa';
import {KoaImpl} from 'sasdn-zipkin';

KoaImpl.initTracerInfo(`http://127.0.0.1:9411/api/v1/spans`, {
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

TypeOrmImpl.setTracerInfo({
  remoteService: {
    serviceName: 'sqlite'
  }
});
  
const conn = await createConnection({
  type: 'sqlite',
  database: './User.db',
  entities: entities,
});
const proxyConn = new TypeOrmImpl().createClient(conn, ctx);
```

