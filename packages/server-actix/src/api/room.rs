use actix_web::{error, get, web, HttpMessage, HttpRequest, Responder, Result, Scope};
use livekit_api::access_token;

use crate::common::{AppState, AuthClaims, LiveKitToken};

#[get("/getRoomToken")]
async fn get_room_token(req: HttpRequest, data: web::Data<AppState>) -> Result<impl Responder> {
  let id = req.extensions().get::<AuthClaims>().unwrap().id.clone();

  let Ok(livekit_token) =
    access_token::AccessToken::with_api_key(&data.livekit_key, &data.livekit_secret)
      .with_identity(id.as_str())
      .with_grants(access_token::VideoGrants {
        room_join: true,
        room: "my-room".to_string(),
        ..Default::default()
      })
      .to_jwt()
  else {
    return Err(error::ErrorNotFound("err"));
  };
  Ok(web::Json(LiveKitToken { livekit_token }))
}

pub fn get_room_scope() -> Scope {
  web::scope("/api/room").service(get_room_token)
}