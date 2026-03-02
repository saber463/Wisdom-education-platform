fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::compile_protos("protos/rust_service.proto")?;
    Ok(())
}
