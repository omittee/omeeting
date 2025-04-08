import type { RoomNode } from '@/types/room'
import { updateRoom } from '@/api/room'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { DeleteIcon, EditIcon, ShareIcon, Trash2Icon, Tv2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { RoomForm } from './room-form'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

async function handleShare({ code, time, admin }: { code: string, time: string, admin: string }) {
  await navigator.clipboard.writeText(`${admin}邀请你参加会议：\n` + `会议号： ${code} \n` + `会议时间: ${time}`)
  toast.success('复制成功', { position: 'top-center' })
}

const baseUpdateRoomReq = {
  start_time: null,
  end_time: null,
  admin: null,
  user_ids: null,
  is_canceled: null,
}

export function RoomInfos({
  data,
  className,
  onJoinRoom,
  onFinished
}: {
  data: RoomNode[]
  className: string
  onJoinRoom: (code: string) => void
  onFinished?: () => void
}) {
  async function handleCancel(id: string) {
    await updateRoom({ ...baseUpdateRoomReq, is_canceled: true }, id)
    toast.success('会议取消成功', { position: 'top-center' })
    onFinished?.()
  }
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [curData, setCurData] = useState<{
    id: number
    start_time: number
    end_time: number
    users_ids: string[]
    admin: string
  } | undefined>(undefined)
  return (
    <div className={cn('h-full mt-4 pt-4', className)}>
      {
        data.map(({ id, code, start_time, end_time, users_ids, is_canceled, admin, record_videos, video_base }) => {
          const time = `${format(new Date(start_time * 1000), 'yyyy-MM-dd HH:mm')} ~ ${format(new Date(end_time * 1000), 'yyyy-MM-dd HH:mm')}`
          return (
            <Card className="mb-4" key={id}>
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="flex justify-between">
                  <div className="font-bold">{`${admin} 主持的会议`}</div>
                  { is_canceled && <Badge variant="secondary">已取消</Badge>}
                </CardTitle>
                <CardDescription>{`会议号: ${code}`}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 pb-2">
                <div>会议时间: </div>
                {time}
              </CardContent>
              <CardFooter className="pb-4 flex justify-between">
                <div className="flex gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Trash2Icon className="text-red-500" onClick={() => is_canceled || handleCancel(id.toString())} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>取消会议</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ShareIcon onClick={() => handleShare({ code, time, admin })} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>分享</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <EditIcon onClick={async () => {
                          if (is_canceled) return
                          setCurData({ id, start_time, end_time, users_ids, admin });
                          setIsDialogOpen(true)
                        }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>编辑</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Dialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                            <Tv2Icon className={ record_videos ? '' : 'text-zinc-400' }/>
                    </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>查看录屏</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    <DialogContent>
                      <DialogTitle>查看录屏</DialogTitle>
                      <div className="w-full flex flex-col gap-4">
                        {
                          record_videos.split(';').filter(Boolean).map((r) => (
                            <div key={r} >
                              <div className='mb-2'>{r}</div>
                              <video src={`${video_base}/${r}`} controls></video>
                            </div>
                          ))
                        }
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                </div>
                <Button size="sm" disabled={is_canceled} onClick={() => onJoinRoom(code)}>进入会议</Button>
              </CardFooter>
            </Card>
          )
        })
      }
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle></DialogTitle>
          <RoomForm isCreating={false} close={() => setIsDialogOpen(false)} data={curData} onFinished={onFinished}/>
        </DialogContent>
      </Dialog>
    </div>
  )
}
