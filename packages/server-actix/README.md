# start
```bash
# set openssl keys
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -sha256

# set envs
echo "DATABASE_URL=<your db url>" > .env
echo "SERVER_URL=<your server url, e.g. 127.0.0.1:8080>" > .env
echo "JWT_SECRET=<your jwt secret>" > .env
echo "LIVEKIT_API_KEY=<your livekit api key>" > .env
echo "LIVEKIT_API_SECRET=<your livekit api secret>" > .env
echo "LIVEKIT_URL=<your livekit server url, e.g. wss://xxx.livekit.cloud>" > .env
```

run:

```bash
# debug
RUST_LOG=server_actix=debug cargo run

# generate api types to packages/app-tauri/src/types
cargo test export_bindings
```

# dev
update entity: 
1. edit migration files
2. run: 
```bash
DATABASE_URL="sqlite://db.sqlite?mode=rwc" sea-orm-cli migrate refresh
sea-orm-cli generate entity -o src/entities --with-serde both 
```