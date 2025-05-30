//! `SeaORM` Entity, @generated by sea-orm-codegen 1.1.4

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "room_user")]
pub struct Model {
  #[sea_orm(primary_key)]
  pub id: i32,
  pub user_id: String,
  pub room_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
  #[sea_orm(
    belongs_to = "super::room::Entity",
    from = "Column::RoomId",
    to = "super::room::Column::Id",
    on_update = "NoAction",
    on_delete = "NoAction"
  )]
  Room,
  #[sea_orm(
    belongs_to = "super::user::Entity",
    from = "Column::UserId",
    to = "super::user::Column::Id",
    on_update = "NoAction",
    on_delete = "NoAction"
  )]
  User,
}

impl Related<super::room::Entity> for Entity {
  fn to() -> RelationDef {
    Relation::Room.def()
  }
}

impl Related<super::user::Entity> for Entity {
  fn to() -> RelationDef {
    Relation::User.def()
  }
}

impl ActiveModelBehavior for ActiveModel {}
