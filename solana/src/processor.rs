// processor.rs (partially implemented)

use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  msg,
  program::invoke,
  program_error::ProgramError,
  pubkey::Pubkey,
};

use crate::instruction::WrapperInstruction;

pub struct Processor;
impl Processor {
  pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
  ) -> ProgramResult {
    let instruction = WrapperInstruction::unpack(instruction_data)?;

    match instruction {
      WrapperInstruction::TransferIn { amount } => {
        Self::process_wrapper_in(accounts, amount, program_id)
      }

      WrapperInstruction::TransferOut { amount } => {
        Self::process_wrapper_in(accounts, amount, program_id)
      }
    }
  }

  fn process_wrapper_in(
    accounts: &[AccountInfo],
    _amount: u64,
    _program_id: &Pubkey,
  ) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let initializer = next_account_info(account_info_iter)?;

    if !initializer.is_signer {
      return Err(ProgramError::MissingRequiredSignature);
    }

    let token_program = next_account_info(account_info_iter)?;
    let sender_associated_account = next_account_info(account_info_iter)?;
    let receiver_associated_account = next_account_info(account_info_iter)?;

    let transfer_sender_to_receiver_ix = spl_token::instruction::transfer(
      token_program.key,
      sender_associated_account.key,
      receiver_associated_account.key,
      initializer.key,
      &[&initializer.key],
      1,
    )?;

    invoke(
      &transfer_sender_to_receiver_ix,
      &[
        sender_associated_account.clone(),
        receiver_associated_account.clone(),
        initializer.clone(),
        token_program.clone(),
      ],
    )?;

    Ok(())
  }
}
