import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { userId } from '@/constants'
import { cn } from '@/lib/utils'
import { useChat } from '@livekit/components-react'
import { format } from 'date-fns'
import { MessageCircleIcon, Send } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { ScrollArea } from '../ui/scroll-area'

export default function Chat() {
  const username = localStorage.getItem(userId) ?? ''
  const [input, setInput] = useState('')

  const { send, chatMessages, isSending } = useChat()

  const handleSend = useCallback(async (event: Event) => {
    event.preventDefault()
    if (input.trim().length === 0)
      return
    await send(input)
    setInput('')
  }, [input, send])
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="rounded-full w-14 h-14"
        >
          <MessageCircleIcon className="!w-8 !h-8" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle></DrawerTitle>
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-72">
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className="w-full text-sm"
                  >
                    <div className={cn('text-xs pb-1', message.from?.identity === username ? 'text-right' : '')}>{ `${message.from?.identity} ${format(new Date(message.timestamp), 'MM/dd-HH:mm:ss')}` }</div>
                    <div
                      className={cn(
                        'w-max max-w-[75%] flex flex-col gap-2 rounded-lg px-3 py-2',
                        message.from?.identity === username
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted',
                      )}
                    >
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form
              onSubmit={handleSend}
              className="flex w-full items-center space-x-2"
            >
              <Input
                id="message"
                placeholder="请输入信息"
                className="flex-1"
                autoComplete="off"
                value={input}
                onChange={event => setInput(event.target.value)}
                disabled={isSending}
              />
              <Button type="submit" size="icon" disabled={input.trim().length === 0}>
                <Send />
                <span className="sr-only">发送</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </DrawerContent>
    </Drawer>

  )
}
