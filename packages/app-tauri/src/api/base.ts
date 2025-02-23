import type { BaseResponse } from '@/types/base'

export const authToken = 'authToken'

export async function createRequest<Req, Ret extends BaseResponse>({
  url,
  method,
  headers,
  needAuth,
}: {
  url: string
  method: Request['method']
  headers?: Record<string, string>
  needAuth?: boolean
}) {
  return async (data: Req, path?: string) => {
    if (needAuth) {
      headers = { ...(headers ?? {}), Authorization: `Bearer ${sessionStorage.getItem(authToken)}` }
    }
    const res = await fetch(`${url}/${path ?? ''}`, {
      method,
      body: JSON.stringify(data),
      headers,
    })
    const t = res.json() as unknown as Ret
    if (t.ret !== 0) {
      console.error(t.msg)
      
    }
    return t
  }
}
