use sea_orm_migration::{prelude::*, schema::*};

use super::m20250120_000001_create_user_table::User;
use super::m20250202_072600_create_room_table::Room;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(RoomUser::Table)
          .if_not_exists()
          .col(pk_auto(RoomUser::Id).integer().not_null())
          .col(string(RoomUser::UserId).not_null())
          .foreign_key(
            ForeignKey::create()
              .name("fk-RoomUser-user_id")
              .from(RoomUser::Table, RoomUser::UserId)
              .to(User::Table, User::Id),
          )
          .col(integer(RoomUser::RoomId))
          .foreign_key(
            ForeignKey::create()
              .name("fk-RoomUser-room_id")
              .from(RoomUser::Table, RoomUser::RoomId)
              .to(Room::Table, Room::Id),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(RoomUser::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
pub enum RoomUser {
  Table,
  Id,
  UserId,
  RoomId,
}
