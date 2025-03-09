use crate::entities::room_user;
use log::debug;
use sea_orm::{
  ActiveValue, ColumnTrait, Condition, DatabaseConnection, DbErr, EntityTrait,
  QueryFilter,
};

pub struct RoomUserService;

impl RoomUserService {
  pub async fn create_room_user(
    dbconn: &DatabaseConnection,
    room_users: Vec<room_user::ActiveModel>,
  ) -> Result<(), DbErr> {
    if room_users.is_empty() {
      return Ok(())
    }
    room_user::Entity::insert_many(room_users)
      .exec(dbconn)
      .await
      .and(Ok(()))
  }
  pub async fn get_users_by_room_id(
    dbconn: &DatabaseConnection,
    room_id: i32,
  ) -> Result<Vec<room_user::Model>, DbErr> {
    room_user::Entity::find()
      .filter(Condition::all().add(room_user::Column::RoomId.eq(room_id)))
      .all(dbconn)
      .await
  }
  pub async fn get_rooms_by_user_id(
    dbconn: &DatabaseConnection,
    user_id: String,
  ) -> Result<Vec<room_user::Model>, DbErr> {
    room_user::Entity::find()
      .filter(Condition::all().add(room_user::Column::UserId.eq(user_id)))
      .all(dbconn)
      .await
  }
  
  pub async fn delete_room_user(dbconn: &DatabaseConnection, ids: Vec<i32>) -> Result<(), DbErr> {
    room_user::Entity::delete_many()
      .filter(room_user::Column::Id.is_in(ids))
      .exec(dbconn)
      .await
      .and(Ok(()))
  }

  pub async fn update_room_user(dbconn: &DatabaseConnection, room_id: i32, user_ids: &Vec<String>) -> Result<(), DbErr> {
    let room_users = Self::get_users_by_room_id(dbconn, room_id).await?;

    let users_to_delete = room_users
      .iter()
      .filter(|model| !user_ids.contains(&model.user_id)).map(|model| model.id).collect();

    Self::delete_room_user(dbconn, users_to_delete).await?;

    let room_users: Vec<String> = room_users.into_iter().map(|model| model.user_id).collect();
    let users_to_add: Vec<room_user::ActiveModel> = user_ids
      .into_iter()
      .filter(|id| !room_users.iter().any(|user_id| user_id == *id))
      .map(|id| room_user::ActiveModel {
        room_id: ActiveValue::set(room_id),
        user_id: ActiveValue::set(id.clone()),
        ..Default::default()
      }).collect();

    Self::create_room_user(dbconn, users_to_add).await?;

    Ok(())
  }

}
