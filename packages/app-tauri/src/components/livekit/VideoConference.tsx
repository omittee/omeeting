import { MessageCircleIcon, MicIcon, MicOffIcon, PhoneIcon, VideoIcon, VideoOffIcon } from 'lucide-react'
import { useState } from 'react'
import { AspectRatio } from '../ui/aspect-ratio'
import { Button } from '../ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer'
import Chat from './Chat'
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel'

export default function VideoConference() {
  const [videoOn, setVideoOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="flex justify-center items-center flex-1 w-full h-full">
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              
            </CarouselItem>
          </CarouselContent>
        </Carousel>
        <AspectRatio ratio={16 / 9}>
          <video src=""></video>
        </AspectRatio>

      </div>
      <div className="flex gap-3 py-4">
        <Button size="icon" className="rounded-full w-16 h-16" onClick={() => setVideoOn(!videoOn)}>
          { videoOn ? <VideoIcon className="!w-8 !h-8" /> : <VideoOffIcon className="!w-8 !h-8" />}
        </Button>
        <Button size="icon" className="rounded-full w-16 h-16" onClick={() => setMicOn(!micOn)}>
          { micOn ? <MicIcon className="!w-8 !h-8" /> : <MicOffIcon className="!w-8 !h-8" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full w-16 h-16"><PhoneIcon className="!w-8 !h-8" /></Button>
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="icon" className="rounded-full w-16 h-16"><MessageCircleIcon className="!w-8 !h-8" /></Button>
          </DrawerTrigger>
          <DrawerContent>
            <Chat></Chat>
          </DrawerContent>
        </Drawer>

      </div>
    </div>
  )
}
