mod api;
mod services;
mod entities;

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use api::user::get_user_scope;
use sea_orm::Database;
use std::env;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // init db
    dotenv::dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");
    let db = Database::connect(database_url).await;
    println!("db connected: {:?}", db);

    // init ssl
    let mut builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();
    builder
        .set_private_key_file("key.pem", SslFiletype::PEM)
        .unwrap();
    builder.set_certificate_chain_file("cert.pem").unwrap();

    // start server
    let server_url = env::var("SERVER_URL").expect("SERVER_URL must be set in .env file");
    let server = HttpServer::new(|| {
        App::new()
        .wrap_fn(|req, srv | {
            todo!("middleware");
            println!("Hi from start. You requested: {}", req.path());
            srv.call(req).map(|res| {
                println!("Hi from response");
                res
            })
        })
            .service(get_user_scope())
            .service(hello)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
    .bind_openssl(server_url.as_str(), builder)?
    .run();

    println!("Server running at https://{server_url}");
    server.await
}

