use std::time::{self, Duration, UNIX_EPOCH};

use crate::{common::AppState, entities::user, services::user::UserService};
use actix_web::{
  delete, error, post, put, web, HttpMessage, HttpRequest, Responder, Result, Scope,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use log::debug;
use password_auth::{generate_hash, verify_password};
use sea_orm::DatabaseConnection;
use ts_rs::TS;

use crate::common::{AuthClaims, AuthToken, BaseResponse};

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/user.ts")]
pub struct UserLoginRes {
  #[serde(flatten)]
  pub base: BaseResponse,
  pub data: Option<AuthToken>,
}

async fn verify_user(id: String, password: String, db_conn: &DatabaseConnection) -> Result<(), BaseResponse> {
  let Ok(user_model) = UserService::get_user(db_conn, id).await else {
    return Err(BaseResponse {
      ret: -1,
      msg: "用户不存在".to_string(),
    });
  };
  if !verify_password(password, &user_model.password).is_ok() {
    return Err(BaseResponse {
      ret: -1,
      msg: "用户密码错误".to_string(),
    });
  }
  Ok(())
}

#[post("/login")]
async fn login(body: web::Json<user::Model>, data: web::Data<AppState>) -> Result<impl Responder> {
  if let Err(e) = verify_user(body.id.clone(), body.password.clone(), &data.db_conn).await {
    return Ok(web::Json(UserLoginRes {
      base: e,
      data: None,
    }));
  };
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
  Ok(web::Json(UserLoginRes {
    base: BaseResponse {
      ret: 0,
      msg: "用户登录成功".to_string(),
    },
    data: Some(AuthToken { auth_token }),
  }))
}

#[put("/create")]
async fn create_user(
  body: web::Json<user::Model>,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  UserService::create_user(
    &data.db_conn,
    user::Model {
      id: body.id.clone(),
      password: generate_hash(body.password.clone()),
    },
  )
  .await
  .map_or_else(
    |_| {
      Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "用户创建失败".to_string(),
      }))
    },
    |_| {
      Ok(web::Json(BaseResponse {
        ret: 0,
        msg: "用户创建成功".to_string(),
      }))
    },
  )
}

#[delete("/delete")]
async fn delete_user(req: HttpRequest, data: web::Data<AppState>) -> Result<impl Responder> {
  UserService::delete_user(
    &data.db_conn,
    req.extensions().get::<AuthClaims>().unwrap().id.clone(),
  )
  .await
  .map_or_else(
    |_| {
      Ok(web::Json(BaseResponse {
        ret: -1,
        msg: "用户删除失败".to_string(),
      }))
    },
    |_| {
      Ok(web::Json(BaseResponse {
        ret: 0,
        msg: "用户删除成功".to_string(),
      }))
    },
  )
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/user.ts")]
pub struct UserUpdateReq {
  pub old_password: String,
  pub new_password: String,
}

#[post("/update")]
async fn update_user(
  body: web::Json<UserUpdateReq>,
  req: HttpRequest,
  data: web::Data<AppState>,
) -> Result<impl Responder> {
  let user_id = req.extensions().get::<AuthClaims>().unwrap().id.clone();
  if let Err(e) = verify_user(user_id.clone(), body.old_password.clone(), &data.db_conn).await {
    return Ok(web::Json(e));
  };
  UserService::change_password(
    &data.db_conn,
    user::Model {
      id: user_id,
      password: generate_hash(body.new_password.clone()),
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

pub fn get_user_scope() -> Scope {
  web::scope("/api/user")
    .service(create_user)
    .service(delete_user)
    .service(update_user)
    .service(login)
}
