import type {
  TrackReferenceOrPlaceholder,
  WidgetState,
} from '@livekit/components-core'
import type { MessageFormatter } from '@livekit/components-react'
import { isEqualTrackRef, isTrackReference, log } from '@livekit/components-core'
import { LayoutContextProvider, ParticipantTile, useCreateLayoutContext, usePinnedTracks, useTracks } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { MessageCircleIcon, MicIcon, MicOffIcon, PhoneIcon, VideoIcon, VideoOffIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../ui/button'
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel'
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer'
import Chat from './Chat'
import { Tracks } from './Tracks'

export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter
  /** @alpha */
  SettingsComponent?: React.ComponentType
}

export default function VideoConference({
  chatMessageFormatter,
  SettingsComponent,
  ...props
}: VideoConferenceProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  })
  const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null)

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  )

  const widgetUpdate = (state: WidgetState) => {
    log.debug('updating widget state', state)
    setWidgetState(state)
  }

  const layoutContext = useCreateLayoutContext()

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter(track => track.publication.source === Track.Source.ScreenShare)

  const focusTrack = usePinnedTracks(layoutContext)?.[0]
  const carouselTracks = tracks.filter(track => !isEqualTrackRef(track, focusTrack))

  useEffect(() => {
    // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
    if (
      screenShareTracks.some(track => track.publication.isSubscribed)
      && lastAutoFocusedScreenShareTrack.current === null
    ) {
      log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] })
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] })
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0]
    }
    else if (
      lastAutoFocusedScreenShareTrack.current
      && !screenShareTracks.some(
        track =>
          track.publication.trackSid
          === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      log.debug('Auto clearing screen share focus.')
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' })
      lastAutoFocusedScreenShareTrack.current = null
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        tr =>
          tr.participant.identity === focusTrack.participant.identity
          && tr.source === focusTrack.source,
      )
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack })
      }
    }
  }, [
    screenShareTracks
      .map(ref => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ])

  const [videoOn, setVideoOn] = useState(false)
  const [micOn, setMicOn] = useState(false)

  return (
    <LayoutContextProvider
      value={layoutContext}
      // onPinChange={handleFocusStateChange}
      onWidgetChange={widgetUpdate}
    >
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="flex justify-center items-center flex-1 w-full h-full">
          <Carousel className="w-7/8 ">
            <CarouselContent>
              <Tracks tracks={carouselTracks}>
                <CarouselItem>
                  <ParticipantTile />
                </CarouselItem>
              </Tracks>
            </CarouselContent>
          </Carousel>

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

    </LayoutContextProvider>
  )
}
