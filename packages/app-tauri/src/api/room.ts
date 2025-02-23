import type { BaseResponse } from '@/types/base'
import type { CreateRoomReq, RoomListRes, RoomTokenRes, UpdateRoomReq } from '@/types/room'
import { createRequest } from './base'

export const createRoom = createRequest<CreateRoomReq, BaseResponse>({
  url: '/api/room/create',
  method: 'PUT',
})

export const updateRoom = createRequest<UpdateRoomReq, BaseResponse>({
  url: '/api/room/update',
  method: 'POST',
})

export const getRoomToken = createRequest<undefined, RoomTokenRes>({
  url: '/api/room/roomToken',
  method: 'GET',
})

export const getRooms = createRequest<undefined, RoomListRes>({
  url: '/api/rooms',
  method: 'GET',
})