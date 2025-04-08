import type { BaseResponse } from '@/types/base'
import { authTokenKey } from '@/constants'
import { toast } from 'sonner'

const base = `${import.meta.env.VITE_ServerUrl}`

export function createRequest<Req, Ret extends BaseResponse>({
  url,
  method,
  headers,
  needAuth = true,
}: {
  url: string
  method: Request['method']
  headers?: Record<string, string>
  needAuth?: boolean
}) {
  return async (data: Req, path?: string) => {
    if (needAuth) {
      const token = localStorage.getItem(authTokenKey)
      if (!token) {
        return
      }
      headers = { ...(headers ?? {}), Authorization: `Bearer ${token}` }
    }
    try {
      const res = await fetch(`${base}${url}/${path ?? ''}`, {
        method,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          ...(headers ?? {}),
        },
      })
      if (res.status === 401) {
        return
      }
      const t = await res.json() as unknown as Ret
      if (t.ret !== 0) {
        toast.error(t.msg, { position: 'top-center' })
        return
      }
      return t
    }
    catch (e) {
      console.error(e)
      toast.error('网络错误', { position: 'top-center' })
    }
  }
}
