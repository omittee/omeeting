# start
```bash
# set envs
echo "VITE_LiveKitUrl=<your livekit server url, e.g. wss://xxx.livekit.cloud>" > .env
echo "VITE_ServerUrl=<your server url, e.g. 127.0.0.1:8080>" > .env

# dev 
cargo tauri android dev 

# set proxy
# set adb proxy whistle
adb shell settings put global http_proxy 127.0.0.1:8899
# export client port
adb reverse tcp:1420 tcp:1420
# export server port
adb reverse tcp:8081 tcp:8081
# export proxy port
adb reverse tcp:8899 tcp:8899
```

# todo
1. filter => ai generate
2. record cloudflare
3. webgpu whisper => chat
