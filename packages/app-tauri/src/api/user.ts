import type { BaseResponse } from '@/types/base'
import type { GptFilterReq } from '@/types/room'
import type { GptFilterRes, UserLoginRes, UserUpdateReq } from '@/types/user'
import { createRequest } from './base'

export const createUser = createRequest<{ id: string, password: string }, BaseResponse>({
  url: '/api/user/create',
  method: 'PUT',
  needAuth: false,
})

export const login = createRequest<{ id: string, password: string }, UserLoginRes>({
  url: '/api/user/login',
  method: 'POST',
  needAuth: false,
})

export const deleteUser = createRequest<void, BaseResponse>({
  url: '/api/user/delete',
  method: 'DELETE',
})

export const updatePassword = createRequest<UserUpdateReq, BaseResponse>({
  url: '/api/user/update',
  method: 'POST',
})

export const getGptFilter = createRequest<GptFilterReq, GptFilterRes>({
  url: '/api/user/getGptFilter',
  method: 'POST',
})
