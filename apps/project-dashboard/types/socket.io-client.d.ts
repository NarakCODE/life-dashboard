declare module "socket.io-client" {
  export interface Socket {
    on<TArgs extends unknown[]>(
      event: string,
      listener: (...args: TArgs) => void,
    ): void;
    emit(event: string, ...args: unknown[]): void;
    disconnect(): void;
  }

  export function io(
    url: string,
    options?: Record<string, unknown>,
  ): Socket;
}
