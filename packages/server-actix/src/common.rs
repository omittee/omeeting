use sea_orm::DatabaseConnection;
use ts_rs::TS;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct AuthClaims {
  pub id: String,
  pub exp: usize,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct AuthToken {
  pub auth_token: String,
}
#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct LiveKitToken {
  pub livekit_token: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
  pub jwt_auth_secret: String,
  pub db_conn: DatabaseConnection,
  pub livekit_secret: String,
  pub livekit_key: String,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct BaseResponse {
  pub ret: i32,
  pub msg: String,
}
