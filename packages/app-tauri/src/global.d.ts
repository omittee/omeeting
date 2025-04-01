declare interface Window {
  __vad_asr: {
    vad: any
    buffer: any
    mediaStream: any
    recorder: any
    audioCtx: AudioContext
    recognizer: any
    initialized: boolean
  }
}
declare global {
  let Module: any
}
