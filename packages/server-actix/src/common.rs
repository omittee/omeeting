use std::sync::Arc;

use futures_util::lock::Mutex;
use livekit_api::services::egress::EgressClient;
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
pub struct Filter {
  pub filter: String,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct LiveKitToken {
  pub livekit_token: String,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct LiveKitEgressInfo {
  pub egress_id: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
  pub jwt_auth_secret: String,
  pub db_conn: DatabaseConnection,
  pub livekit_secret: String,
  pub livekit_key: String,
  pub livekit_url: String,
  pub livekit_egress_client: Arc<Mutex<EgressClient>>,
  pub s3_access_key: String,
  pub s3_secret: String,
  pub s3_endpoint: String,
  pub s3_bucket: String,
  pub gpt_api_key: String,
  pub gpt_base_url: String,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/base.ts")]
pub struct BaseResponse {
  pub ret: i32,
  pub msg: String,
}
