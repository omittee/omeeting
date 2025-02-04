pub use sea_orm_migration::prelude::*;

mod m20250120_000001_create_user_table;
mod m20250202_072600_create_room_table;
mod m20250202_115557_room_user_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
  fn migrations() -> Vec<Box<dyn MigrationTrait>> {
    vec![
            Box::new(m20250120_000001_create_user_table::Migration),
            Box::new(m20250202_072600_create_room_table::Migration),
            Box::new(m20250202_115557_room_user_table::Migration),
        ]
  }
}
