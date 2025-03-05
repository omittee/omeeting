import { RoomForm } from '@/components/room-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { User } from '@/components/user'

export default function Home() {
  return (
    <div className="p-8 h-full bg-slate-100">
      <User className="pt-10" />
      <div className="flex flex-1 gap-4 w-full pt-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button>加入会议</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>请输入会议号</DialogTitle>
            <div className="w-full justify-center">
              <InputOTP maxLength={9}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
                <InputOTPGroup>
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <DialogClose className="flex gap-4 flex-row w-full justify-center">
                <Button variant="secondary">取消</Button>
                <Button disabled>加入</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button>创建会议</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle></DialogTitle>
            <RoomForm isCreating />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
