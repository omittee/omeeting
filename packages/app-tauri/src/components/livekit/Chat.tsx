import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { useChat } from '@livekit/components-react'

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: 'Hi, how can I help you today?',
    },
    {
      role: 'user',
      content: 'Hey, I\'m having trouble with my account.',
    },
    {
      role: 'agent',
      content: 'What seems to be the problem?',
    },
    {
      role: 'user',
      content: 'I can\'t log in.',
    },
  ])
  const [input, setInput] = useState('')
  const inputLength = input.trim().length

  const { send, chatMessages, isSending } = useChat();
  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <ScrollArea className="h-72">
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    message.from?.identity === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  {message.message}
                </div>
              ))}
            </div>
          </ScrollArea>

        </CardContent>
        <CardFooter>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (inputLength === 0)
                return
              await send(input);
              setInput('')
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={event => setInput(event.target.value)}
            />
            <Button type="submit" size="icon" disabled={inputLength === 0}>
              <Send />
              <span className="sr-only">发送</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  )
}
