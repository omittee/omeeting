use sea_orm_migration::{prelude::*, schema::*};

use super::m20250120_000001_create_user_table::User;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(Room::Table)
          .if_not_exists()
          .col(
            ColumnDef::new(Room::Id)
              .integer()
              .not_null()
              .primary_key()
              .auto_increment(),
          )
          .col(ColumnDef::new(Room::Code).string().not_null())
          .col(ColumnDef::new(Room::IsCanceled).boolean().not_null().default(false))
          .col(ColumnDef::new(Room::CurEgressId).string().not_null().default(""))
          .col(ColumnDef::new(Room::RecordVideos).string().not_null().default(""))
          .col(ColumnDef::new(Room::StartTime).date_time().not_null())
          .col(ColumnDef::new(Room::EndTime).date_time().not_null())
          .col(ColumnDef::new(Room::Admin).string().not_null())
          .foreign_key(
            ForeignKey::create()
              .name("fk-Room-user_id")
              .from(Room::Table, Room::Admin)
              .to(User::Table, User::Id),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(Room::Table).to_owned())
      .await
  }
}

#[derive(Iden)]
pub enum Room {
  Table,
  Id,
  Code,
  Admin,
  StartTime,
  EndTime,
  IsCanceled,
  RecordVideos,
  CurEgressId,
}
