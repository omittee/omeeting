# start
```bash
# set openssl keys
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -sha256

# set envs
echo "DATABASE_URL=<your db url>" > .env
echo "SERVER_URL=<your server url, e.g. 127.0.0.1:8080>" > .env
```

run:

```bash
# debug
RUST_LOG=server_actix=debug cargo run

# generate api types to packages/app-tauri/src/types
cargo test export_bindings
```