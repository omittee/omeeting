use crate::services::user::UserService;
use actix_web::{get, web, Responder, Result, Scope};

#[get("/get")]
async fn get_user() -> Result<impl Responder> {
  Ok(web::Json(UserService::get_user().await.expect("Cannot find user")))
}


pub fn get_user_scope() -> Scope {
  web::scope("/api/user").service(get_user)
}