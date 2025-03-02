import type { CreateRoomReq } from '@/types/room'

import type { ComponentProps } from 'react'
import { createRoom } from '@/api/room'
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
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { DateTimePicker } from './date-time-picker'

export function RoomForm({
  className,
}: ComponentProps<'div'>) {
  const [roomData, setRoomData] = useState({
    start_time: new Date(),
    end_time: new Date(),
    users_ids: [],
  })
  const handleCreateRoom = async () => {
    // createRoom()
  }
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">创建会议</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="acctname">开始时间</Label>
                <DateTimePicker dateTime={roomData.start_time} onDateTimeChange={(date) => {
                  setRoomData({ ...roomData, start_time: date })
                }} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">结束时间</Label>
                <DateTimePicker dateTime={roomData.end_time} onDateTimeChange={(date) => {
                  setRoomData({ ...roomData, end_time: date })
                }} />
              </div>
              { true && (
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="2">会议用户</Label>
                  </div>
                  <Input id="2" type="password" value={2} required />
                </div>
              )}
              <Button className="w-full" disabled={(!3 || !1) || (true && 1 !== 2)}>
                { true ? '创建账号并登录' : '登录' }
              </Button>
              <div className="text-center text-sm">

                { true ? '已有账号？ ' : '没有账号？ '}
                <a href="#" className="underline underline-offset-4">
                  { true ? '登录' : '创建一个'}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
