use crate::entities::user;
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, Condition, DatabaseConnection, DbErr, EntityTrait,
  QueryFilter,
};

pub struct UserService;

impl UserService {
  pub async fn create_user(dbconn: &DatabaseConnection, user: user::Model) -> Result<(), DbErr> {
    user::Entity::insert(user::ActiveModel::from(user))
      .exec(dbconn)
      .await
      .and(Ok(()))
  }
  pub async fn get_user(dbconn: &DatabaseConnection, id: String) -> Result<user::Model, DbErr> {
    user::Entity::find_by_id(id.clone())
      .one(dbconn)
      .await?
      .ok_or(DbErr::RecordNotFound(id))
  }
  pub async fn get_users(
    dbconn: &DatabaseConnection,
    ids: &Vec<String>,
  ) -> Result<Vec<user::Model>, DbErr> {
    user::Entity::find()
      .filter(user::Column::Id.is_in(ids))
      .all(dbconn)
      .await
  }
  pub async fn delete_user(dbconn: &DatabaseConnection, id: String) -> Result<(), DbErr> {
    user::ActiveModel {
      id: ActiveValue::Set(id),
      ..Default::default()
    }
    .delete(dbconn)
    .await
    .and(Ok(()))
  }
  pub async fn change_password(
    dbconn: &DatabaseConnection,
    user: user::ActiveModel,
  ) -> Result<(), DbErr> {
    user.update(dbconn).await.and(Ok(()))
  }
}
