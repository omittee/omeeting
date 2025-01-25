use sea_orm::DatabaseConnection;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct AuthClaims {
  pub id: String,
  pub exp: usize,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct AuthToken {
  pub auth_token: String,
}
#[derive(serde::Deserialize, serde::Serialize)]
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
