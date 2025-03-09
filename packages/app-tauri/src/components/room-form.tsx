import type { CreateRoomReq } from '@/types/room'

import type { ComponentProps } from 'react'
import { createRoom, updateRoom } from '@/api/room'
import { createUser, login } from '@/api/user'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authToken, userId } from '@/constants'
import { cn } from '@/lib/utils'
import { HelpCircleIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { DateTimePicker } from './date-time-picker'
import { TimePicker } from './time-picker'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function RoomForm({
  className,
  isCreating,
  data,
  close,
  onFinished
}: ComponentProps<'div'> & {
  isCreating: boolean
  data?: {
    id: number
    start_time: number
    end_time: number
    users_ids: string[]
    admin: string
  }
  close?: () => void,
  onFinished?: () => void
}) {
  const name = sessionStorage.getItem(userId) ?? ''
  const diffMin = data ? (data.end_time - data.start_time) / 60 : 60
  const defaultData = {
    start_time: data?.start_time ? new Date(data.start_time * 1000) : new Date(),
    end_time: [diffMin / 60, diffMin % 60] as [number, number],
    users_ids: (data?.users_ids ?? []).join(' '),
    admin: data?.admin,
  }
  const [roomData, setRoomData] = useState({ ...defaultData })
  const handleCreateRoom = async () => {
    const start_time = Math.floor(roomData.start_time.getTime() / 1000)
    const [h, m] = roomData.end_time
    await createRoom({
      start_time,
      end_time: start_time + (h * 60 + m) * 60,
      users_ids: [...new Set(roomData.users_ids.trim().split(/\s+/).concat(name))],
    })
    toast.success('会议创建成功', { position: 'top-center' })
    onFinished?.()
    if (close) {
      close()
    }
    else {
      setRoomData({
        ...defaultData
      })
    }
  }
  const handleUpdateRoom = async () => {
    const start_time = Math.floor(roomData.start_time.getTime() / 1000)
    const [h, m] = roomData.end_time
    await updateRoom({
      start_time,
      end_time: start_time + (h * 60 + m) * 60,
      user_ids: [...new Set(roomData.users_ids.trim().split(/\s+/).concat(name))],
      admin: roomData.admin ?? null,
      is_canceled: null
    }, data?.id.toString())
    toast.success('会议更新成功', { position: 'top-center' })
    onFinished?.()
    if (close) {
      close()
    }
    else {
      setRoomData({
        ...defaultData
      })
    }
  }
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{isCreating ? '创建会议' : '编辑会议'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="acctname">开始时间</Label>
                <DateTimePicker
                  className="max-w-full"
                  dateTime={roomData.start_time}
                  onDateTimeChange={(date) => {
                    setRoomData({ ...roomData, start_time: date })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <TimePicker
                  time={roomData.end_time}
                  labelName="持续时间"
                  className="justify-center w-full"
                  onTimeChange={(time) => {
                    setRoomData({ ...roomData, end_time: time })
                  }}
                >
                </TimePicker>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="2" className="flex gap-2 items-center">
                    <div>会议用户</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircleIcon className="text-gray-300 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>输入用户名，以空格分隔</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>
                <Input id="users" value={roomData.users_ids} required onChange={e => setRoomData({ ...roomData, users_ids: e.target.value })} />
              </div>
              { isCreating || (
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="2" className="flex gap-2 items-center">
                      <div>会议管理员</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircleIcon className="text-gray-300 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>输入用户名，仅一名</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>
                  <Input id="users" value={roomData.admin} required onChange={e => setRoomData({ ...roomData, admin: e.target.value })} />
                </div>
              )}
              <Button className="w-full" disabled={roomData.users_ids === ''} onClick={(e) => {
                e.preventDefault();
                isCreating ? handleCreateRoom() : handleUpdateRoom()
              }}>
                { isCreating ? '创建会议' : '更新' }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
