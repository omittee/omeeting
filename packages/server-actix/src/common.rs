use sea_orm::DatabaseConnection;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Claims {
    pub id: String,
    pub exp: usize,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct JWTToken {
    pub token: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub jwt_secret: String,
    pub db_conn: DatabaseConnection,
}
