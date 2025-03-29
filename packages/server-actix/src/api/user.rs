use std::time::{self, Duration, UNIX_EPOCH};

use crate::{common::{AppState, Filter}, entities::user, services::user::UserService};
use actix_web::{
  delete, error, post, put, web, HttpMessage, HttpRequest, Responder, Result, Scope,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use log::debug;
use password_auth::{generate_hash, verify_password};
use reqwest::Client;
use sea_orm::{ActiveValue, DatabaseConnection};
use serde_json::json;
use ts_rs::TS;

use crate::common::{AuthClaims, AuthToken, BaseResponse};

async fn verify_user(
  id: String,
  password: String,
  db_conn: &DatabaseConnection,
) -> Result<(), BaseResponse> {
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

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/user.ts")]
pub struct GptFilterRes {
  #[serde(flatten)]
  pub base: BaseResponse,
  pub data: Option<Filter>,
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/room.ts")]
pub struct GptFilterReq {
  pub prompt: String,
}


#[derive(serde::Deserialize, std::fmt::Debug)]
pub struct GPTMessage {
  pub content: String,
}
#[derive(serde::Deserialize, std::fmt::Debug)]
pub struct GPTChoice {
  pub message: GPTMessage,
}
#[derive(serde::Deserialize)]
pub struct GPTResp {
  pub choices: Vec<GPTChoice>,
}

#[post("/getGptFilter")]
async fn get_gpt_filter(
  data: web::Data<AppState>,
  body: web::Json<GptFilterReq>,
) -> Result<impl Responder> {
  let client = Client::new();
  let Ok(resp) = client
    .post(data.gpt_base_url.clone())
    .header("Content-Type", "application/json")
    .header("Authorization", format!("Bearer {}", data.gpt_api_key))
    .json(&json!({
      "model": "deepseek-v3-0324",
      "messages": [
        { "role": "system", "content": r#"
你是一个精通 css 滤镜的专家，你需要帮助用户生成期望的滤镜参数，可用的 css 滤镜及其参数范围限制如下:
{"blur":{"max":10,"min":0},"brightness":{"max":3,"min":0},"contrast":{"max":3,"min":0},"grayscale":{"max":1,"min":0},"hue-rotate":{"max":360,"min":0},"invert":{"max":1,"min":0},"opacity":{"max":1,"min":0},"saturate":{"max":3,"min":0},"sepia":{"max":1,"min":0}}
对应的 css 滤镜需要解析成规范的 json，如 css "filter: blur(10px) brightness(2) hue-rotate(180deg)" 对应的返回值为 {"blur":10,"brightness":2,"hue-rotate":180}
要求：
1. 严格按照上述滤镜名和参数范围限制，返回对应的 json 格式，禁止输出其他无关或不符合格式要求的信息
2. 如果用户输入的内容与滤镜无关，返回的json为空对象
示例：
输入1：帮我生成一个明亮的，充满怀旧感的滤镜。
输出1: {"brightness":1.2,"sepia":0.95}

输入2: 9.11 和 9.8 哪个大？
输出2: {}
解释：输入1按要求生成对应的滤镜 json，输入2内容与滤镜无关或不能用对应的滤镜参数表达，返回空对象
下面是用户的描述：
"# },
        { "role": "user", "content": body.prompt }
      ],
      "stream": false
    }))
    .send()
    .await
  else {
    return Ok(web::Json(GptFilterRes {
      base: BaseResponse {
        ret: -1,
        msg: "请求失败，请稍后再试".to_string(),
      },
      data: None,
    }));
  };

  let Ok(GPTResp { choices }) = resp.json::<GPTResp>().await else {
    return Ok(web::Json(GptFilterRes {
      base: BaseResponse {
        ret: -1,
        msg: "解析失败，请稍后再试".to_string(),
      },
      data: None,
    }));
  };
  if choices.is_empty() {
    return Ok(web::Json(GptFilterRes {
      base: BaseResponse {
        ret: -1,
        msg: "解析失败，请稍后再试".to_string()
      },
      data: None,
    }));
  }

  Ok(web::Json(GptFilterRes {
    base: BaseResponse {
      ret: 0,
      msg: "获取推荐滤镜成功".to_string()
    },
    data: Some(Filter { filter: choices[0].message.content.clone() })
  }))
}

#[derive(serde::Deserialize, serde::Serialize, TS)]
#[ts(export, export_to = "../../app-tauri/src/types/user.ts")]
pub struct UserLoginRes {
  #[serde(flatten)]
  pub base: BaseResponse,
  pub data: Option<AuthToken>,
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
  if UserService::get_user(&data.db_conn, body.id.clone())
    .await
    .is_ok()
  {
    return Ok(web::Json(BaseResponse {
      ret: -1,
      msg: "用户已存在，创建失败".to_string(),
    }));
  }
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
    user::ActiveModel {
      id: ActiveValue::Set(user_id),
      password: ActiveValue::Set(generate_hash(body.new_password.clone())),
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
    .service(get_gpt_filter)
    .service(create_user)
    .service(delete_user)
    .service(update_user)
    .service(login)
}
