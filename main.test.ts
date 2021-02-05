import {JsonSerializers, RSocketClient} from "rsocket-core";
import RSocketWebSocketClient from "rsocket-websocket-client";
import WebSocket from "ws";
import {Flowable} from "rsocket-flowable";
import {Payload, ReactiveSocket} from "rsocket-types";

describe('RSocket-JS', () => {

  let socket: ReactiveSocket<object, object>

  beforeAll(async () => {
    const socketClient = new RSocketClient<object, object>({
      serializers: JsonSerializers,
      setup: {
        dataMimeType: 'text/plain',
        metadataMimeType: 'text/plain',
        keepAlive: 30_000,
        lifetime: 90_000,
      },
      transport: new RSocketWebSocketClient({
        url: 'ws://localhost:14243',
        wsCreator: url => new WebSocket(url),
      }),
    });
    socket = await socketClient.connect();
  })

  afterAll(() => {
    socket.close();
  })

  it("incoming stream completes with an error", (done) => {
    const payloads: Flowable<Payload<object, object>> = new Flowable(subscriber => {
      subscriber.onSubscribe({
        request(n: number) {
          console.log(`requested ${n}`)
          if (n === 1) {
            // initial
            subscriber.onNext({data: {msg: 'hello'}})
          } else {
            // the rest
            subscriber.onError(new Error('oh no'))
          }
        },
        cancel() {
          console.log('cancel')
          done.fail('should never happen')
        }
      })
    })

    socket.requestChannel(payloads).subscribe({
      onSubscribe(s) {
        console.log("onSubscribe")
        s.request(2147483647);
      },
      onNext(msg) {
        console.log(`onNext ${msg.data}`)
        expect((msg.data as any).msg).toBe('hello');
      },
      onError(err) {
        console.log(`onError ${err.message}`)
        expect(err.message).toContain('oh no')
        done();
      },
      onComplete() {
        console.log(`onComplete`)
        done.fail('should never happen')
      }
    })
  })
});

