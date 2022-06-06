// instruction.rs (partially implemented)

use crate::error::WrapperError::InvalidInstruction;
use solana_program::program_error::ProgramError;
use std::convert::TryInto;

pub enum WrapperInstruction {
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person to transfer NFTs 
    /// 2. `[]` The token program
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 5. `[]` The receiver's token account
    TransferIn {
        /// The amount of NFTs for being wrapped
        amount: u64,
    },

    TransferOut {
        /// The amout of NFTs being warpped
        amount: u64,
    },
}

impl WrapperInstruction {
    /// Unpacks a byte buffer into a [WrapperInstruction](enum.WrapperInstructionF.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => Self::TransferIn {
                amount: Self::unpack_amount(rest)?,
            },
            1 => Self::TransferOut {
                amount: Self::unpack_amount(rest)?,
            },
            _ => return Err(InvalidInstruction.into()),
        })
    }

    fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
        let amount = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;
        Ok(amount)
    }
}
