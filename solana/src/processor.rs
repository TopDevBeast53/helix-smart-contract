// processor.rs (partially implemented)

use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  program_error::ProgramError,
  msg,
  pubkey::Pubkey,
//   program_pack::{Pack, IsInitialized},
//   sysvar::{rent::Rent, Sysvar},
  program::invoke
};

use crate::{instruction::EscrowInstruction, error::EscrowError};

pub struct Processor;
impl Processor {
  pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
      let instruction = EscrowInstruction::unpack(instruction_data)?;

      match instruction {
          EscrowInstruction::TransferIn { amount } => {
              Self::process_init_escrow(accounts, amount, program_id)
          }

          EscrowInstruction::TransferOut { amount } => {
            Self::process_init_escrow(accounts, amount, program_id)
        }
      }
  }

  fn process_init_escrow(
      accounts: &[AccountInfo],
      _amount: u64,
      _program_id: &Pubkey,
  ) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let initializer = next_account_info(account_info_iter)?;

    msg!("initializer key: {}", initializer.key);

    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let token_program = next_account_info(account_info_iter)?;
    msg!("token program: {}", token_program.key);

    let sender_associated_account = next_account_info(account_info_iter)?;

    msg!("sender: {}", sender_associated_account.key);
    
    let receiver_associated_account = next_account_info(account_info_iter)?;

    msg!("receiver: {}", receiver_associated_account.key);


    let transfer_sender_to_receiver_ix = spl_token::instruction::transfer(
        token_program.key, 
        sender_associated_account.key, 
        receiver_associated_account.key, 
        initializer.key, 
        &[&initializer.key], 
        1
    )?;

    msg!("what is happening here");

    invoke(
        &transfer_sender_to_receiver_ix,
        &[
            sender_associated_account.clone(),
            receiver_associated_account.clone(),
            initializer.clone(),
            token_program.clone(),
        ],
    )?;


    //   let temp_token_account = next_account_info(account_info_iter)?;

    //   let token_to_receive_account = next_account_info(account_info_iter)?;
    //   if *token_to_receive_account.owner != spl_token::id() {
    //       return Err(ProgramError::IncorrectProgramId);
    //   }
      
    //   let escrow_account = next_account_info(account_info_iter)?;
    //   let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

    //   if !rent.is_exempt(escrow_account.lamports(), escrow_account.data_len()) {
    //       return Err(EscrowError::NotRentExempt.into());
    //   }

    //   let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
    //   if escrow_info.is_initialized() {
    //       return Err(ProgramError::AccountAlreadyInitialized);
    //   }

      Ok(())
  }
}