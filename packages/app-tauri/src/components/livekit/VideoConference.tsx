import type {
  TrackReferenceOrPlaceholder,
  WidgetState,
} from '@livekit/components-core'
import type { MessageFormatter } from '@livekit/components-react'
import { startRecord, stopRecord } from '@/api/room'
import { isEqualTrackRef, isTrackReference, log, supportsScreenSharing } from '@livekit/components-core'
import { LayoutContextProvider, useCreateLayoutContext, useDisconnectButton, usePersistentUserChoices, usePinnedTracks, useTracks } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { CircleIcon, CircleOffIcon, MicIcon, MicOffIcon, PhoneIcon, ScreenShareIcon, ScreenShareOffIcon, VideoIcon, VideoOffIcon } from 'lucide-react'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel'
import Chat from './Chat'
import { ParticipantTile } from './ParticipantTile'
import { Tracks } from './Tracks'
import { TrackToggle } from './TrackToggle'

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

  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
  } = usePersistentUserChoices({ defaults: { videoEnabled: false, audioEnabled: false } })

  const microphoneOnChange = useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  )

  const cameraOnChange = useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveVideoInputEnabled(enabled) : null,
    [saveVideoInputEnabled],
  )

  const navigate = useNavigate()

  const { buttonProps: { onClick: disConnectBtnClick } } = useDisconnectButton({})
  const handleDisconnect = useCallback(((...args) => {
    disConnectBtnClick(...args)
    navigate('/')
  }) as React.MouseEventHandler<HTMLButtonElement>, [disConnectBtnClick, navigate])

  const browserSupportsScreenSharing = supportsScreenSharing()

  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false)

  const onScreenShareChange = useCallback(
    (enabled: boolean) => {
      setIsScreenShareEnabled(enabled)
    },
    [setIsScreenShareEnabled],
  )

  const [egressId, setEgressId] = useState('')

  const [searchParams] = useSearchParams()
  const handleRecord = async () => {
    if (egressId) {
      const res = await stopRecord(undefined, `${searchParams.get('roomId')}/${egressId}`)
      setEgressId('')
      if (res?.ret === 0) {
        toast.success(res.msg, { position: 'top-center' })
      }
    }
    else {
      const res = await startRecord(undefined, searchParams.get('roomId') ?? '')
      const eid = res?.data?.egress_id
      if (eid)
        setEgressId(eid)
      if (res?.ret === 0) {
        toast.success(res.msg, { position: 'top-center' })
      }
    }
  }

  return (
    <LayoutContextProvider
      value={layoutContext}
      // onPinChange={handleFocusStateChange}
      onWidgetChange={widgetUpdate}
    >
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="flex justify-center items-center flex-1 w-full h-full">
          <div className="flex flex-col justify-center w-full h-full gap-3">
            {focusTrack ? <ParticipantTile trackRef={focusTrack} /> : carouselTracks[0] && <ParticipantTile trackRef={carouselTracks[0]} />}
            {/* <Carousel className="w-7/8 ">
              <CarouselContent>
                <Tracks tracks={carouselTracks}>
                  <CarouselItem>
                    <ParticipantTile className="h-full" />
                  </CarouselItem>
                </Tracks>
              </CarouselContent>
            </Carousel> */}
            <div className="flex justify-start gap-1 overflow-x-auto">
              <Tracks tracks={carouselTracks}>
                <ParticipantTile className="w-[150px] h-[150px]" />
              </Tracks>
            </div>

          </div>

        </div>
        <div className="flex gap-3 py-4">
          <TrackToggle
            source={Track.Source.Microphone}
            onChange={microphoneOnChange}
          >
            { userChoices.audioEnabled ? <MicIcon className="!w-8 !h-8" /> : <MicOffIcon className="!w-8 !h-8" />}
          </TrackToggle>

          <TrackToggle
            source={Track.Source.Camera}
            onChange={cameraOnChange}
          >
            { userChoices.videoEnabled ? <VideoIcon className="!w-8 !h-8" /> : <VideoOffIcon className="!w-8 !h-8" />}
          </TrackToggle>
          {
            browserSupportsScreenSharing && (
              <TrackToggle
                source={Track.Source.ScreenShare}
                captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
                onChange={onScreenShareChange}
              >
                {(isScreenShareEnabled ? <ScreenShareOffIcon className="!w-8 !h-8" /> : <ScreenShareIcon className="!w-8 !h-8" />)}
              </TrackToggle>
            )
          }
          <Chat></Chat>
          <Button size="icon" className="rounded-full w-14 h-14" onClick={handleRecord}>
            { egressId ? <CircleOffIcon className="!w-8 !h-8" /> : <CircleIcon className="!w-8 !h-8" />}
          </Button>
          <Button variant="destructive" size="icon" className="rounded-full w-14 h-14" onClick={handleDisconnect}>
            <PhoneIcon className="!w-8 !h-8" />
          </Button>
        </div>
      </div>

    </LayoutContextProvider>
  )
}
