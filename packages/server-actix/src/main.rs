mod api;
mod common;
mod entities;
mod services;

use actix_web::{
  error, get, middleware, post, web, App, HttpMessage, HttpResponse, HttpServer, Responder,
};
use actix_web_httpauth::{extractors::bearer::BearerAuth, middleware::HttpAuthentication};
use api::{room::get_room_scope, user::get_user_scope};
use common::{AppState, AuthClaims};
use jsonwebtoken::{decode, DecodingKey, Validation};
use log::{debug, info};
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use sea_orm::Database;
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
  HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
  HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
  HttpResponse::Ok().body("Hey there!")
}

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

  let state = AppState {
    jwt_auth_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set in .env file"),
    db_conn: db.unwrap(),
    livekit_key: env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY must be set in .env file"),
    livekit_secret: env::var("LIVEKIT_API_SECRET")
      .expect("LIVEKIT_API_SECRET must be set in .env file"),
  };
  // start server
  let server_url = env::var("SERVER_URL").expect("SERVER_URL must be set in .env file");
  let server = HttpServer::new(move || {
    App::new()
      .app_data(web::Data::new(state.clone()))
      .wrap(middleware::Logger::default())
      .wrap(HttpAuthentication::with_fn(
        |req, credentials: Option<BearerAuth>| async move {
          let path = req.path();
          debug!("path: {}", path);
          if path == "/api/user/login" || path == "/api/user/create" {
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
      .service(hello)
      .service(echo)
      .route("/hey", web::get().to(manual_hello))
  })
  .bind_openssl(server_url.as_str(), ssl_builder)?
  .workers(1)
  .run();

  info!("Server running at https://{server_url}");
  server.await
}
