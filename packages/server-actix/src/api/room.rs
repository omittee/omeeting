use actix_web::{
  delete, error, get, post, put, web, HttpMessage, HttpRequest, Responder, Result, Scope,
};
use livekit_api::access_token;
use sea_orm::sqlx::types::chrono;
use sea_orm::{ActiveValue, LoaderTrait};

use crate::common::{AppState, AuthClaims, BaseResponse, LiveKitToken};

use crate::entities::{room, room_user};
use crate::services::room::RoomService;
use crate::services::room_user::RoomUserService;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct RoomTokenRes {
  #[serde(flatten)]
  pub base: BaseResponse,
  pub data: Option<LiveKitToken>,
}

#[get("/roomToken/{room_code}")]
async fn get_room_token(
  path: web::Path<String>,
  req: HttpRequest,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  let user_id = req.extensions().get::<AuthClaims>().unwrap().id.clone();

  let rooms = RoomUserService::get_rooms_by_user_id(&data.db_conn, user_id.clone())
    .await
    .unwrap();

  let room_code = path.into_inner();
  let Some(room) = rooms
    .load_one(room::Entity, &data.db_conn)
    .await
    .unwrap()
    .into_iter()
    .filter_map(|x| x)
    .find(|x| x.code == room_code)
  else {
    return Ok(web::Json(RoomTokenRes {
      base: BaseResponse {
        ret: -1,
        msg: "找不到对应会议".to_string(),
      },
      data: None,
    }));
  };

  let Ok(livekit_token) =
    access_token::AccessToken::with_api_key(&data.livekit_key, &data.livekit_secret)
      .with_identity(user_id.as_str())
      .with_grants(access_token::VideoGrants {
        room_join: true,
        room: room.id.to_string(),
        ..Default::default()
      })
      .to_jwt()
  else {
    return Ok(web::Json(RoomTokenRes {
      base: BaseResponse {
        ret: -1,
        msg: "获取 room token 失败".to_string(),
      },
      data: None,
    }));
  };
  Ok(web::Json(RoomTokenRes {
    base: BaseResponse {
      ret: 0,
      msg: "获取 room token 成功".to_string(),
    },
    data: Some(LiveKitToken { livekit_token }),
  }))
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateRoomReq {
  pub start_time: chrono::NaiveDateTime,
  pub end_time: chrono::NaiveDateTime,
  pub users_ids: Vec<String>,
}

#[put("/create")]
async fn create_room(
  req: HttpRequest,
  body: web::Json<CreateRoomReq>,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  if body.users_ids.is_empty() {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "会议创建失败, 用户列表为空".to_string(),
    }));
  }
  let Ok(code) = RoomService::get_no_dup_code(&data.db_conn).await else {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "会议创建失败".to_string(),
    }));
  };
  let create_res = RoomService::create_room(
    &data.db_conn,
    room::ActiveModel {
      code: ActiveValue::Set(code),
      start_time: ActiveValue::Set(body.start_time),
      end_time: ActiveValue::Set(body.end_time),
      admin: ActiveValue::Set(req.extensions().get::<AuthClaims>().unwrap().id.clone()),
      ..Default::default()
    },
  )
  .await
  .unwrap();

  RoomUserService::create_room_user(
    &data.db_conn,
    body
      .users_ids
      .iter()
      .map(|u| room_user::ActiveModel {
        room_id: ActiveValue::Set(create_res.last_insert_id),
        user_id: ActiveValue::Set(u.clone()),
        ..Default::default()
      })
      .collect(),
  )
  .await
  .map_or_else(
    |_| {
      Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "会议创建失败".to_string(),
      }))
    },
    |_| {
      Ok(web::Json(BaseResponse {
        ret: 0,
        msg: "会议创建成功".to_string(),
      }))
    },
  )
}

// #[delete("/delete/{room_id}")]
// async fn delete_user(
//   path: web::Path<i32>,
//   req: HttpRequest,
//   data: web::Data<AppState>,
// ) -> Result<impl Responder> {
//   let room_id = path.into_inner();
//   let Ok(room) = RoomService::get_room_by_id(&data.db_conn, room_id).await else {
//     return Ok(web::Json(BaseResponse {
//       ret: -1,
//       msg: "找不到对应会议".to_string(),
//     }));
//   };
//   if room.admin != req.extensions().get::<AuthClaims>().unwrap().id {
//     return Ok(web::Json(BaseResponse {
//       ret: -1,
//       msg: "非管理员无权操作".to_string(),
//     }));
//   }

//   RoomService::delete_room(&data.db_conn, room.id)
//     .await
//     .map_or_else(
//       |_| {
//         Ok(web::Json(BaseResponse {
//           ret: -1,
//           msg: "会议删除失败".to_string(),
//         }))
//       },
//       |_| {
//         Ok(web::Json(BaseResponse {
//           ret: 0,
//           msg: "会议删除成功".to_string(),
//         }))
//       },
//     )
// }

#[derive(serde::Deserialize, serde::Serialize)]
pub struct UpdateRoomReq {
  start_time: Option<chrono::NaiveDateTime>,
  end_time: Option<chrono::NaiveDateTime>,
  admin: Option<String>,
  is_canceled: Option<bool>,
  user_ids: Option<Vec<String>>,
}

#[post("/update/{room_id}")]
async fn update_room(
  path: web::Path<i32>,
  body: web::Json<UpdateRoomReq>,
  req: HttpRequest,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  let room_id = path.into_inner();
  let Ok(room) = RoomService::get_room_by_id(&data.db_conn, room_id).await else {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "找不到对应会议".to_string(),
    }));
  };
  if room.admin != req.extensions().get::<AuthClaims>().unwrap().id {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "非管理员无权操作".to_string(),
    }));
  }

  if let Some(user_ids) = &body.user_ids {
    let _ = RoomUserService::update_room_user(&data.db_conn, room_id, user_ids).await;
  }

  RoomService::update_room(
    &data.db_conn,
    room::Model {
      start_time: body.start_time.unwrap_or(room.start_time),
      end_time: body.end_time.unwrap_or(room.end_time),
      admin: body.admin.clone().unwrap_or(room.admin),
      is_canceled: body.is_canceled.clone().unwrap_or(room.is_canceled),
      ..room
    },
  )
  .await
  .map_or_else(
    |_| {
      Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "用户更新失败".to_string(),
      }))
    },
    |_| {
      Ok(web::Json(BaseResponse {
        ret: 0,
        msg: "用户更新成功".to_string(),
      }))
    },
  )
}

pub fn get_room_scope() -> Scope {
  web::scope("/api/room").service(get_room_token)
}
