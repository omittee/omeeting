use std::time::{self, Duration, UNIX_EPOCH};

use crate::{common::AppState, entities::user, services::user::UserService};
use actix_web::{delete, error, get, post, put, web, HttpMessage, HttpRequest, Responder, Result, Scope};
use jsonwebtoken::{encode, EncodingKey, Header};
use log::debug;

use crate::common::{AuthClaims, AuthToken};

#[post("/login")]
async fn login(body: web::Json<user::Model>, data: web::Data<AppState>) -> Result<impl Responder> {
  let exp = time::SystemTime::now() + Duration::new(30 * 24 * 60 * 60, 0);
  let Ok(auth_token) = encode(
    &Header::default(),
    &AuthClaims {
      id: body.id.clone(),
      exp: exp
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs() as usize,
    },
    &EncodingKey::from_secret(data.jwt_auth_secret.as_ref()),
  ) else {
    return Err(error::ErrorUnauthorized("Failed to encode token"));
  };
  Ok(web::Json(AuthToken { auth_token }))
}

// #[put("/create")]
// async fn create_user(body: ) -> Result<impl Responder> {
  
// }

#[delete("/delete")]
async fn delete_user(req: HttpRequest, data: web::Data<AppState>) -> Result<impl Responder> {
  todo!("set the response type");
  // if (UserService::delete_user(&data.db_conn, req.extensions().get::<AuthClaims>().unwrap().id.clone()).await).is_ok() {
    
  // } else {
    
  // }
}

pub fn get_user_scope() -> Scope {
  web::scope("/api/user").service(delete_user).service(login)
}
