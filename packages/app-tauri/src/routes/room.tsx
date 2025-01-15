import type { VideoCodec } from 'livekit-client'
import { VideoConferenceClientImpl } from '@/components/VideoConferenceClientImpl'
import { videoCodecs } from 'livekit-client'
import { useSearchParams } from 'react-router'

export default function Room() {
  const [searchParams] = useSearchParams()
  const [liveKitUrl, token, codec] = [
    searchParams.get('liveKitUrl'),
    searchParams.get('token'),
    searchParams.get('codec'),
  ]
  if (typeof liveKitUrl !== 'string') {
    return <h2>缺少 LiveKit URL</h2>
  }
  if (typeof token !== 'string') {
    return <h2>缺少 LiveKit token</h2>
  }
  if (codec !== undefined && videoCodecs.includes(codec as VideoCodec)) {
    return (
      <h2>
        codec 无效, 只支持 [
        {videoCodecs.join(', ')}
        ].
      </h2>
    )
  }

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      <VideoConferenceClientImpl liveKitUrl={liveKitUrl} token={token} codec={codec as VideoCodec} />
    </main>
  )
}
