use std::time::{self, Duration, UNIX_EPOCH};

use crate::{common::AppState, entities::user, services::user::UserService};
use actix_web::{get, post, error, web, Responder, Result, Scope};
use jsonwebtoken::{encode, EncodingKey, Header};
use log::debug;

use crate::common::{Claims, JWTToken};

#[post("/login")]
async fn login(body: web::Json<user::Model>, data: web::Data<AppState>) -> Result<impl Responder> {
  debug!("login: {:?}", body);
  let exp = time::SystemTime::now() + Duration::new(30 * 24 * 60 * 60, 0);
  debug!("exp, {:?}", exp);
  let Ok(token) = encode(&Header::default(), &Claims {
    id: body.id.clone(),
    exp: exp.duration_since(UNIX_EPOCH).expect("Time went backwards")
    .as_secs() as usize,
  }, &EncodingKey::from_secret(data.jwt_secret.as_ref())) else {
    return Err(error::ErrorUnauthorized("Failed to encode token"));
  };
  debug!("token, {:?}", token);
  Ok(web::Json(JWTToken { token }))
}

#[get("/get")]
async fn get_user() -> Result<impl Responder> {
  debug!("get user!!!!!!!!");
  Ok(web::Json(UserService::get_user().await.expect("Cannot find user")))
}

pub fn get_user_scope() -> Scope {
  web::scope("/api/user").service(get_user).service(login)
}

