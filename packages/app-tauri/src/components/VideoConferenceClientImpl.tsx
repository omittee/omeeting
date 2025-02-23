'use client'

import type {
  RoomConnectOptions,
  RoomOptions,
  VideoCodec,
} from 'livekit-client'
import { SettingsMenu } from '@/components/SettingsMenu'
import { formatChatMessageLinks, LiveKitRoom } from '@livekit/components-react'
import {
  Room,
  VideoPresets,
} from 'livekit-client'
import { useMemo } from 'react'
import VideoConference from './livekit/VideoConference'

export function VideoConferenceClientImpl({ liveKitUrl, token, codec }: {
  liveKitUrl: string
  token: string
  codec: VideoCodec | undefined
}) {
  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        videoCodec: codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
    }
  }, [])

  const room = useMemo(() => new Room(roomOptions), [])

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    }
  }, [])

  return (
    <LiveKitRoom
      className='h-full'
      room={room}
      token={token}
      connectOptions={connectOptions}
      serverUrl={liveKitUrl}
      audio
      video
    >
      <VideoConference
        chatMessageFormatter={formatChatMessageLinks}
        SettingsComponent={SettingsMenu}
      />
    </LiveKitRoom>
  )
}
