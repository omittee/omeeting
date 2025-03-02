import { RoomForm } from '@/components/room-form'
import { Button } from '@/components/ui/button'
import { User } from '@/components/user'

export default function Home() {
  return (
    <div className="p-8 h-full bg-slate-100">
      <User className="pt-10" />
      <div className="flex flex-1 gap-4 w-full pt-10">
        <Button>加入会议</Button>
        <Button>创建会议</Button>
      </div>
      <RoomForm />
    </div>
  )
}
