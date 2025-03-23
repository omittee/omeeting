import type { BaseResponse } from '@/types/base'
import type { CreateRoomReq, LiveKitEgressInfoRes, RoomListRes, RoomTokenRes, UpdateRoomReq } from '@/types/room'
import { createRequest } from './base'

export const createRoom = createRequest<CreateRoomReq, BaseResponse>({
  url: '/api/room/create',
  method: 'PUT',
})

export const updateRoom = createRequest<UpdateRoomReq, BaseResponse>({
  url: '/api/room/update',
  method: 'POST',
})

export const getRoomToken = createRequest<void, RoomTokenRes>({
  url: '/api/room/roomToken',
  method: 'GET',
})

export const getRooms = createRequest<void, RoomListRes>({
  url: '/api/room/rooms',
  method: 'GET',
})

export const startRecord = createRequest<void, LiveKitEgressInfoRes>({
  url: '/api/room/record',
  method: 'POST',
})

export const stopRecord = createRequest<void, LiveKitEgressInfoRes>({
  url: '/api/room/stopRecord/{egress_id}',
  method: 'POST',
})