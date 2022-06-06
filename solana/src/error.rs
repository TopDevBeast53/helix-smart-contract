// error.rs (partially implemented)

use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum WrapperError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
    /// Not Rent Exempt
    #[error("Not Rent Exempt")]
    NotRentExempt,
}

impl From<WrapperError> for ProgramError {
    fn from(e: WrapperError) -> Self {
        ProgramError::Custom(e as u32)
    }
}