mod api;
mod common;
mod entities;
mod services;

use actix_cors::Cors;
use actix_web::{
  error, get, middleware, post, web, App, HttpMessage, HttpResponse, HttpServer, Responder,
};
use actix_web_httpauth::{extractors::bearer::BearerAuth, middleware::HttpAuthentication};
use api::{room::get_room_scope, user::get_user_scope};
use common::{AppState, AuthClaims};
use futures_util::lock::Mutex;
use jsonwebtoken::{decode, DecodingKey, Validation};
use livekit_api::services::egress::EgressClient;
use log::{debug, info};
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use sea_orm::Database;
use std::{env, sync::Arc};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  env_logger::init();
  // init db
  dotenv::dotenv().ok();
  let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");
  let db = Database::connect(database_url).await;
  info!("db connected: {:?}", db);

  // init ssl
  let mut ssl_builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();
  ssl_builder
    .set_private_key_file("key.pem", SslFiletype::PEM)
    .unwrap();
  ssl_builder.set_certificate_chain_file("cert.pem").unwrap();


  let livekit_url = env::var("LIVEKIT_URL").expect("LIVEKIT_URL must be set in .env file");
  let mut client = EgressClient::new(&livekit_url).unwrap();
  let state = AppState {
    jwt_auth_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set in .env file"),
    db_conn: db.unwrap(),
    livekit_key: env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY must be set in .env file"),
    livekit_secret: env::var("LIVEKIT_API_SECRET")
      .expect("LIVEKIT_API_SECRET must be set in .env file"),
    livekit_url,
    livekit_egress_client: Arc::new(Mutex::new(client)),
    s3_access_key: env::var("S3_STORAGE_ACCESS_KEY")
      .expect("S3_STORAGE_ACCESS_KEY must be set in .env file"),
    s3_secret: env::var("S3_STORAGE_SECRET").expect("S3_STORAGE_SECRET must be set in .env file"),
    s3_endpoint: env::var("S3_STORAGE_ENDPOINT")
      .expect("S3_STORAGE_ENDPOINT must be set in .env file"),
    s3_bucket: env::var("S3_STORAGE_BUCKET").expect("S3_STORAGE_BUCKET must be set in .env file"),
    gpt_api_key: env::var("GPT_API_KEY").expect("GPT_API_KEY must be set in .env file"),
    gpt_base_url: env::var("GPT_BASE_URL").expect("GPT_BASE_URL must be set in .env file"),
  };
  // start server
  let server_url = env::var("SERVER_URL").expect("SERVER_URL must be set in .env file");
  let server = HttpServer::new(move || {
    App::new()
      .wrap(Cors::permissive())
      .wrap(middleware::NormalizePath::trim())
      .app_data(web::Data::new(state.clone()))
      .wrap(middleware::Logger::default())
      .wrap(HttpAuthentication::with_fn(
        |req, credentials: Option<BearerAuth>| async move {
          let method = req.method();
          if method == "OPTIONS" {
            return Ok(req);
          }
          let path = req.path();

          if ["/api/user/login", "/api/user/create"]
            .iter()
            .any(|p| path.starts_with(p))
          {
            return Ok(req);
          }

          let Some(credentials) = credentials else {
            return Err((error::ErrorUnauthorized("unauthorized"), req));
          };
          let validation = Validation::default();

          let decoding_key = DecodingKey::from_secret(
            req
              .app_data::<web::Data<AppState>>()
              .unwrap()
              .jwt_auth_secret
              .as_ref(),
          );

          let Ok(data) = decode::<AuthClaims>(credentials.token(), &decoding_key, &validation)
          else {
            return Err((error::ErrorUnauthorized("unauthorized"), req));
          };
          // 保存用户信息
          req.extensions_mut().insert(data.claims);

          debug!("id: {}", req.extensions().get::<AuthClaims>().unwrap().id);
          Ok(req)
        },
      ))
      .service(get_user_scope())
      .service(get_room_scope())
  })
  .bind_openssl(server_url.as_str(), ssl_builder)?
  .workers(1)
  .run();

  info!("Server running at https://{server_url}");
  server.await
}
