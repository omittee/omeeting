import type { RoomNode } from '@/types/room'
import type { HTMLAttributes } from 'react'
import type { Route } from './+types/home'
import { getRooms, getRoomToken } from '@/api/room'
import { RoomForm } from '@/components/room-form'
import { RoomInfos } from '@/components/room-infos'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Skeleton } from '@/components/ui/skeleton'
import { User } from '@/components/user'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

// export async function clientLoader() {
//   const res = await getRooms()
//   return res?.data ?? []
// }

export default function Home() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const handleJoinRoom = async (code: string) => {
    const res = await getRoomToken(undefined, code)
    const token = res?.data?.livekit_token
    if (!token) return
    navigate(`/room?liveKitUrl=${import.meta.env.VITE_LiveKitUrl}&token=${token}`)
  }
  const [loaderData, setLoaderData] = useState<RoomNode[]>([])
  const refresh = async () => {
    const res = await getRooms()
    setLoaderData(res?.data ?? [])
  }
  useEffect(() => {
    refresh()
  }, [])
  return (
    <div className="p-8 h-full bg-slate-100 flex flex-col">
      <div className='text-4xl font-extrabold pb-4 italic'>Omeeting</div>
      <User />
      <div className="flex gap-4 w-full pt-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button>加入会议</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>请输入会议号</DialogTitle>
            <div className="w-full justify-center">
              <InputOTP maxLength={9} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <div className="w-full flex flex-row-reverse">
                <Button disabled={code.length !== 9} className="rounded-md" onClick={() => handleJoinRoom(code)}>加入</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button>创建会议</Button>
          </DialogTrigger>
          <DialogContent >
            <DialogTitle></DialogTitle>
            <RoomForm isCreating onFinished={refresh}/>
          </DialogContent>
        </Dialog>
      </div>
      <RoomInfos className="flex-1 overflow-y-auto" data={loaderData} onJoinRoom={handleJoinRoom} onFinished={refresh} ></RoomInfos>
    </div>
  )
}
