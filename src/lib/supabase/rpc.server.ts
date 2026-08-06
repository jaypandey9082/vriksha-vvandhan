import "server-only";

type RpcResult<T> = Promise<{ data: T | null; error: { message: string; code?: string } | null }>;

export function callUntypedRpc<T>(client: unknown, name: string, args: Record<string, unknown> = {}): RpcResult<T> {
  return (client as { rpc: (rpcName: string, rpcArgs: Record<string, unknown>) => RpcResult<T> }).rpc(name, args);
}
