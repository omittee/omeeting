import { useCallback, useEffect, useState } from 'react'

const expectedSampleRate = 16000
let recordSampleRate: number
function downsampleBuffer(buffer: Float32Array, exportSampleRate: number) {
  if (exportSampleRate === recordSampleRate) {
    return buffer
  }
  const sampleRateRatio = recordSampleRate / exportSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = accum / count
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
};

export function useVadAsr() {
  // if (!navigator.mediaDevices.getUserMedia) {
  //   console.error('getUserMedia not supported.')
  //   return
  // }
  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    if (window.__vad_asr.initialized) {
      setIsInitialized(true)
    }
    else {
      const eventListener = () => {
        setIsInitialized(true)
      }
      document.addEventListener('VadAsrInitialized', eventListener)
      return () => {
        document.removeEventListener('VadAsrInitialized', eventListener)
      }
    }
  }, [])

  const [curResTxt, setCurResTxt] = useState('')
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const onSuccess = function (stream: MediaStream) {
    if (!window.__vad_asr.audioCtx) {
      window.__vad_asr.audioCtx = new AudioContext({ sampleRate: expectedSampleRate })
    }
    console.log(window.__vad_asr.audioCtx)
    recordSampleRate = window.__vad_asr.audioCtx.sampleRate
    console.log(`sample rate ${recordSampleRate}`)

    // creates an audio node from the microphone incoming stream
    window.__vad_asr.mediaStream = window.__vad_asr.audioCtx.createMediaStreamSource(stream)
    console.log('media stream', window.__vad_asr.mediaStream)

    // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
    // bufferSize: the onaudioprocess event is called when the buffer is full
    const bufferSize = 4096
    const numberOfInputChannels = 1
    const numberOfOutputChannels = 2
    if (window.__vad_asr.audioCtx.createScriptProcessor) {
      window.__vad_asr.recorder = window.__vad_asr.audioCtx.createScriptProcessor(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels,
      )
    }
    else {
      window.__vad_asr.recorder = window.__vad_asr.audioCtx.createJavaScriptNode(
        bufferSize,
        numberOfInputChannels,
        numberOfOutputChannels,
      )
    }
    console.log('window.__vad_asr.recorder', window.__vad_asr.recorder)

    window.__vad_asr.recorder.onaudioprocess = function (e: any) {
      let samples = new Float32Array(e.inputBuffer.getChannelData(0))
      samples = downsampleBuffer(samples, expectedSampleRate)
      window.__vad_asr.buffer.push(samples)
      while (window.__vad_asr.buffer.size() > window.__vad_asr.vad.config.sileroVad.windowSize) {
        const s = window.__vad_asr.buffer.get(window.__vad_asr.buffer.head(), window.__vad_asr.vad.config.sileroVad.windowSize)
        window.__vad_asr.vad.acceptWaveform(s)
        window.__vad_asr.buffer.pop(window.__vad_asr.vad.config.sileroVad.windowSize)

        while (!window.__vad_asr.vad.isEmpty()) {
          const segment = window.__vad_asr.vad.front()
          window.__vad_asr.vad.pop()

          // non-streaming asr
          const stream = window.__vad_asr.recognizer.createStream()
          stream.acceptWaveform(expectedSampleRate, segment.samples)
          window.__vad_asr.recognizer.decode(stream)
          const recognitionResult = window.__vad_asr.recognizer.getResult(stream)
          console.log(recognitionResult)
          const text = recognitionResult.text
          stream.free()
          console.log(text)

          setCurResTxt(text)
        }
      }
    }
  }
  const start = useCallback(async () => {
    if (mediaStream)
      return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    setMediaStream(stream)
    onSuccess(stream)
    window.__vad_asr.mediaStream.connect(window.__vad_asr.recorder)
    window.__vad_asr.recorder.connect(window.__vad_asr.audioCtx.destination)

    console.log('window.__vad_asr.recorder started')

  }, [mediaStream])
  const stop = useCallback(async () => {
    if (!mediaStream)
      return
    window.__vad_asr.vad.reset()
    window.__vad_asr.buffer.reset()
    console.log('window.__vad_asr.recorder stopped')

    window.__vad_asr.recorder.disconnect(window.__vad_asr.audioCtx.destination)
    window.__vad_asr.mediaStream.disconnect(window.__vad_asr.recorder)
    mediaStream.getTracks().forEach(track => track.stop())
    setMediaStream(null)
  }, [mediaStream])

  const switchAsr = useCallback(() => {
    console.log(window.__vad_asr)
    mediaStream ? stop() : start()
  }, [stop, start, mediaStream])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { start, stop, isInitialized, curResTxt, switchAsr, isAsrEnable: !!mediaStream }
}
