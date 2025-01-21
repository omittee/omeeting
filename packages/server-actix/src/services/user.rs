use crate::entities::user;
use sea_orm::DbErr;

pub struct UserService;

impl UserService {
  pub async fn create_user() {}
  pub async fn get_user() -> Result<user::Model, DbErr> {
    Ok(user::Model {
      id: "111".to_owned(),
      password: "222".to_owned(),
    })
  }
}