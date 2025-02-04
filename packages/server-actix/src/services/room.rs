use std::fmt::format;

use crate::entities::room;
use sea_orm::{
  prelude::DateTime, sqlx::types::chrono, ActiveModelTrait, ActiveValue, ColumnTrait, Condition, DatabaseConnection, DbErr, EntityTrait, InsertResult, QueryFilter
};

use rand::random_range;
pub struct RoomService;

impl RoomService {
  pub async fn get_no_dup_code(dbconn: &DatabaseConnection) -> Result<String, DbErr> {
    let mut res = 0;
    let time = chrono::DateTime::from_timestamp(chrono::Utc::now().timestamp(), 0).unwrap();
    loop {
      res = random_range(0..1_000_000_000);
      if room::Entity::find()
        .filter(
          Condition::all()
            .add(room::Column::Code.eq(res))
            .add(room::Column::EndTime.lt(time)),
        )
        .all(dbconn)
        .await?
        .is_empty()
      {
        break;
      }
    }
    Ok(format!("{:09}", res))
  }
  pub async fn create_room(
    dbconn: &DatabaseConnection,
    room: room::ActiveModel,
  ) -> Result<InsertResult<room::ActiveModel>, DbErr> {
    room::Entity::insert(room).exec(dbconn).await
  }
  pub async fn get_room_by_id(dbconn: &DatabaseConnection, id: i32) -> Result<room::Model, DbErr> {
    room::Entity::find_by_id(id)
      .one(dbconn)
      .await?
      .ok_or(DbErr::RecordNotFound(format!("room not found: {id}")))
  }
  pub async fn update_room(dbconn: &DatabaseConnection, room: room::Model) -> Result<(), DbErr> {
    room::ActiveModel::from(room)
      .update(dbconn)
      .await
      .and(Ok(()))
  }
}
