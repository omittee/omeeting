use actix_web::{
  delete, error, get, post, put, web, HttpMessage, HttpRequest, Responder, Result, Scope,
};
use livekit_api::access_token;
use livekit_api::services::egress::encoding::H264_1080P_30;
use livekit_api::services::egress::{EgressOutput, RoomCompositeOptions};
use livekit_protocol::encoded_file_output::Output;
use livekit_protocol::{EncodedFileOutput, S3Upload};
use log::debug;
use sea_orm::sqlx::types::chrono::NaiveDateTime;
use sea_orm::{ActiveValue, LoaderTrait};
use ts_rs::TS;

use crate::common::{AppState, AuthClaims, BaseResponse, LiveKitEgressInfo, LiveKitToken};

use crate::entities::{room, room_user};
use crate::services::room::RoomService;
use crate::services::room_user::RoomUserService;
use crate::services::user::UserService;

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct LiveKitEgressInfoRes {
  #[serde(flatten)]
  pub base: BaseResponse,
  pub data: Option<LiveKitEgressInfo>,
}

#[post("/record/{room_id}")]
async fn record_room(
  path: web::Path<i32>,
  data: web::Data<AppState>,
  req: HttpRequest,
) -> Result<impl Responder> {

  let room_id = path.into_inner();
  let Ok(room) = RoomService::get_room_by_id(&data.db_conn, room_id).await else {
    return Ok(web::Json(LiveKitEgressInfoRes {
      base: BaseResponse {
        ret: -1,
        msg: "找不到对应会议".to_string(),
      },
      data: None,
    }));
  };
  if room.admin != req.extensions().get::<AuthClaims>().unwrap().id {
    return Ok(web::Json(LiveKitEgressInfoRes {
      base: BaseResponse {
        ret: -1,
        msg: "非管理员无权操作".to_string(),
      },
      data: None,
    }));
  }
  let Some(mut client) = data.livekit_egress_client.try_lock() else {
    return Ok(web::Json(LiveKitEgressInfoRes {
      base: BaseResponse {
        ret: -1,
        msg: "获取 egress 失败".to_string(),
      },
      data: None,
    }));
  };
  let Ok(info) = client
    .start_room_composite_egress(
      &room_id.to_string(),
      vec![EgressOutput::File(EncodedFileOutput {
        filepath: "{room_name}/{time}.mp4".to_string(),
        output: Some(Output::S3(S3Upload {
          access_key: data.s3_access_key.clone(),
          secret: data.s3_secret.clone(),
          endpoint: data.s3_endpoint.clone(),
          bucket: data.s3_bucket.clone(),
          force_path_style: true,
          ..Default::default()
        })),
        ..Default::default()
      })],
      RoomCompositeOptions {
        layout: "grid".to_string(),
        encoding: H264_1080P_30,
        audio_only: false,
        ..Default::default()
      },
    )
    .await
  else {
    return Ok(web::Json(LiveKitEgressInfoRes {
      base: BaseResponse {
        ret: -1,
        msg: "录制会议失败".to_string(),
      },
      data: None,
    }));
  };
  debug!("info {:?}", info);
  drop(client);
  Ok(web::Json(LiveKitEgressInfoRes {
    base: BaseResponse {
      ret: 0,
      msg: "会议录制进行中".to_string(),
    },
    data: Some(LiveKitEgressInfo {
      egress_id: info.egress_id,
    }),
  }))
}
#[post("/stopRecord/{room_id}/{egress_id}")]
async fn stop_record(
  path: web::Path<(i32, String)>,
  data: web::Data<AppState>,
  req: HttpRequest,
) -> Result<impl Responder> {
  let (room_id, egress_id) = path.into_inner();
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
  let Some(mut client) = data.livekit_egress_client.try_lock() else {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "获取 egress 失败".to_string(),
    }));
  };
  let Ok(_) = client.stop_egress(&egress_id).await else {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "停止会议录制失败".to_string(),
    }));
  };
  Ok(web::Json(BaseResponse {
    ret: 0,
    msg: "会议录制已停止".to_string(),
  }))
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
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

  if room.is_canceled {
    return Ok(web::Json(RoomTokenRes {
      base: BaseResponse {
        ret: -1,
        msg: "会议已取消".to_string(),
      },
      data: None,
    }));
  }

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

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct RoomNode {
  pub id: i32,
  pub code: String,
  pub is_canceled: bool,
  pub start_time: f64,
  pub end_time: f64,
  pub admin: String,
  pub users_ids: Vec<String>,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct RoomListRes {
  #[serde(flatten)]
  base: BaseResponse,
  data: Option<Vec<RoomNode>>,
}

#[get("/rooms")]
async fn get_rooms(req: HttpRequest, data: web::Data<AppState>) -> Result<impl Responder> {
  let user_id = req.extensions().get::<AuthClaims>().unwrap().id.clone();

  let room_users = RoomUserService::get_rooms_by_user_id(&data.db_conn, user_id.clone())
    .await
    .unwrap();

  let mut rooms = vec![];
  for r in room_users
    .load_one(room::Entity, &data.db_conn)
    .await
    .unwrap()
  {
    let Some(x) = r else {
      continue;
    };
    let Ok(t) = RoomUserService::get_users_by_room_id(&data.db_conn, x.id).await else {
      continue;
    };
    rooms.push(RoomNode {
      id: x.id,
      code: x.code,
      is_canceled: x.is_canceled,
      start_time: x.start_time.timestamp() as f64,
      end_time: x.end_time.timestamp() as f64,
      admin: x.admin,
      users_ids: t.into_iter().map(|x| x.user_id).collect(),
    });
  }

  Ok(web::Json(RoomListRes {
    base: BaseResponse {
      ret: 0,
      msg: "获取 room token 成功".to_string(),
    },
    data: Some(rooms),
  }))
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct CreateRoomReq {
  pub start_time: f64,
  pub end_time: f64,
  pub users_ids: Vec<String>,
}

#[put("/create")]
async fn create_room(
  req: HttpRequest,
  body: web::Json<CreateRoomReq>,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  if body.users_ids.len() < 2 {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "会议创建失败, 与会人数不足".to_string(),
    }));
  }
  let Ok(users) = UserService::get_users(&data.db_conn, &body.users_ids).await else {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "会议创建失败".to_string(),
    }));
  };
  let not_exists_users = body
    .users_ids
    .iter()
    .filter(|&id| users.iter().find(|u| u.id == *id).is_none())
    .collect::<Vec<_>>();
  if !not_exists_users.is_empty() {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: format!("会议创建失败, 用户 {:?} 不存在", not_exists_users),
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
      start_time: ActiveValue::Set(NaiveDateTime::from_timestamp(body.start_time as i64, 0)),
      end_time: ActiveValue::Set(NaiveDateTime::from_timestamp(body.end_time as i64, 0)),
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
    |x| {
      debug!("create_room_user err: {:?}", x);
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

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct UpdateRoomReq {
  start_time: Option<f64>,
  end_time: Option<f64>,
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
    if user_ids.len() < 2 {
      return Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "会议更新失败, 与会人数不足".to_string(),
      }));
    }
    let Ok(users) = UserService::get_users(&data.db_conn, user_ids).await else {
      return Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "会议更新失败，获取用户异常".to_string(),
      }));
    };
    let not_exists_users = user_ids
      .iter()
      .filter(|&id| users.iter().find(|u| u.id == *id).is_none())
      .collect::<Vec<_>>();
    if !not_exists_users.is_empty() {
      return Ok(web::Json(BaseResponse {
        ret: -1,
        msg: format!("会议更新失败, 用户 {:?} 不存在", not_exists_users),
      }));
    }
    if let Err(e) = RoomUserService::update_room_user(&data.db_conn, room_id, user_ids).await {
      return Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "会议更新失败，更新与会人员异常".to_string(),
      }));
    };
  }

  RoomService::update_room(
    &data.db_conn,
    room::ActiveModel {
      id: ActiveValue::Set(room.id),
      start_time: body
        .start_time
        .map(|x| ActiveValue::Set(NaiveDateTime::from_timestamp(x as i64, 0)))
        .unwrap_or(ActiveValue::NotSet),
      end_time: body
        .end_time
        .map(|x| ActiveValue::Set(NaiveDateTime::from_timestamp(x as i64, 0)))
        .unwrap_or(ActiveValue::NotSet),
      admin: body
        .admin
        .clone()
        .map(|x| ActiveValue::Set(x))
        .unwrap_or(ActiveValue::NotSet),
      is_canceled: body
        .is_canceled
        .map(|x| ActiveValue::Set(x))
        .unwrap_or(ActiveValue::NotSet),
      ..Default::default()
    },
  )
  .await
  .map_or_else(
    |_| {
      debug!("ccc");
      Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "会议更新失败".to_string(),
      }))
    },
    |_| {
      Ok(web::Json(BaseResponse {
        ret: 0,
        msg: "会议更新成功".to_string(),
      }))
    },
  )
}

pub fn get_room_scope() -> Scope {
  web::scope("/api/room")
    .service(record_room)
    .service(stop_record)
    .service(get_room_token)
    .service(get_rooms)
    .service(create_room)
    .service(update_room)
}
