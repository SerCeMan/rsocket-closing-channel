import io.rsocket.SocketAcceptor;
import io.rsocket.core.RSocketServer;
import io.rsocket.transport.netty.server.WebsocketServerTransport;
import reactor.core.publisher.Flux;

public class Main {
  public static void main(String[] args) throws InterruptedException {
    var server = RSocketServer.create( //
        SocketAcceptor.forRequestChannel(source -> {
          var in = Flux.from(source)
              .doOnSubscribe(s -> System.out.println("subscribed to incoming"))
              .doOnCancel(() -> System.out.println("unsubscribed from incoming"))
              .doOnTerminate(() -> System.out.println("terminate incoming"))
              .doOnError(e -> System.out.println("error incoming: " + e.getClass()))
              .doFinally(signal -> System.out.println("signal incoming " + signal));

          // echo
          var out = Flux.from(in);

          return out
              .doOnSubscribe(s -> System.out.println("subscribed to outgoing"))
              .doOnCancel(() -> System.out.println("unsubscribed from outgoing"))
              .doOnComplete(() -> System.out.println("complete outgoing"))
              .doOnTerminate(() -> System.out.println("terminate outgoing"))
              .doOnError(e -> System.out.println("error outgoing: " + e.getClass()))
              .doFinally(signal -> System.out.println("signal outgoing " + signal));
        }))
        .bind(WebsocketServerTransport.create(14243))
        .block();
    System.out.println("server started: " + server.address());
    Thread.currentThread().join();
  }
}
