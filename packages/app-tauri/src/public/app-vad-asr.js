Module = {}

window.__vad_asr = {
  recorder: null, // the microphone
  audioCtx: null,
  mediaStream: null,
  vad: null,
  buffer: null,
  recognizer: null,
  initialized: false,
}

function fileExists(filename) {
  const filenameLen = Module.lengthBytesUTF8(filename) + 1
  const buffer = Module._malloc(filenameLen)
  Module.stringToUTF8(filename, buffer, filenameLen)

  const exists = Module._SherpaOnnxFileExists(buffer)

  Module._free(buffer)

  return exists
}

function initOfflineRecognizer() {
  const config = {
    modelConfig: {
      debug: 1,
      tokens: './tokens.txt',
    },
  }
  if (fileExists('sense-voice.onnx') === 1) {
    config.modelConfig.senseVoice = {
      model: './sense-voice.onnx',
      useInverseTextNormalization: 1,
    }
  }
  else if (fileExists('whisper-encoder.onnx')) {
    config.modelConfig.whisper = {
      encoder: './whisper-encoder.onnx',
      decoder: './whisper-decoder.onnx',
    }
  }
  else if (fileExists('transducer-encoder.onnx')) {
    config.modelConfig.transducer = {
      encoder: './transducer-encoder.onnx',
      decoder: './transducer-decoder.onnx',
      joiner: './transducer-joiner.onnx',
    }
    config.modelConfig.modelType = 'transducer'
  }
  else if (fileExists('nemo-transducer-encoder.onnx')) {
    config.modelConfig.transducer = {
      encoder: './nemo-transducer-encoder.onnx',
      decoder: './nemo-transducer-decoder.onnx',
      joiner: './nemo-transducer-joiner.onnx',
    }
    config.modelConfig.modelType = 'nemo_transducer'
  }
  else if (fileExists('paraformer.onnx')) {
    config.modelConfig.paraformer = {
      model: './paraformer.onnx',
    }
  }
  else if (fileExists('telespeech.onnx')) {
    config.modelConfig.telespeechCtc = './telespeech.onnx'
  }
  else if (fileExists('moonshine-preprocessor.onnx')) {
    config.modelConfig.moonshine = {
      preprocessor: './moonshine-preprocessor.onnx',
      encoder: './moonshine-encoder.onnx',
      uncachedDecoder: './moonshine-uncached-decoder.onnx',
      cachedDecoder: './moonshine-cached-decoder.onnx',
    }
  }
  else {
    console.log('Please specify a model.')
  }

  window.__vad_asr.recognizer = new OfflineRecognizer(config, Module)
}

// https://emscripten.org/docs/api_reference/module.html#Module.locateFile
Module.locateFile = function (path, scriptDirectory = '') {
  console.log(`path: ${path}, scriptDirectory: ${scriptDirectory}`)
  return scriptDirectory + path
}

// https://emscripten.org/docs/api_reference/module.html#Module.locateFile
Module.setStatus = function (status) {
  console.log(`status ${status}`)
  if (status === 'Running...') {
    console.log('Model downloaded. Initializing recongizer...')
  }
}

Module.onRuntimeInitialized = function () {
  console.log('inited!')
  window.__vad_asr.vad = createVad(Module)
  console.log('window.__vad_asr.vad is created!', window.__vad_asr.vad)

  window.__vad_asr.buffer = new CircularBuffer(30 * 16000, Module)
  console.log('CircularBuffer is created!', window.__vad_asr.buffer)

  initOfflineRecognizer()
  window.__vad_asr.initialized = true
  document.dispatchEvent(new Event('VadAsrInitialized'))
}
