use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::{Pubkey, PUBKEY_BYTES},
    program_memory::sol_memcmp,
    program::invoke,
};
use std::convert::TryInto;
use spl_token::{
    error::TokenError::OwnerMismatch
};
use spl_token::instruction as token_instruction;

fn cmp_pubkeys(a: &Pubkey, b: &Pubkey) -> bool {
    sol_memcmp(a.as_ref(), b.as_ref(), PUBKEY_BYTES) == 0
}


#[derive(Clone, Debug, PartialEq)]
pub enum TokenInstruction {
    // Transfers NFT ownership to the program.
    //
    // Accounts expected by this instruction
    // 
    //   0. `readable`         token program
    //   1. `readable, signer` current owner account
    //   2. `writable`         current owner token account
    //   1. `writable`         ATA for this program token account
    //   2. `writable`         Events-queue account
    TransferIn { 
        bsc_address: [u8;32] 
    },
    // Transfers NFT ownership from the program
    //
    // Accounts expected by this instruction
    //
    //    0. `writable` current-owner (should be the program's ATA)
    //    1. `writable` new owner
    TransferOut
}

impl TokenInstruction {
    /// Unpacks a byte buffer into a [TokenInstruction](enum.TokenInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        use ProgramError::InvalidInstructionData;
        let (&tag, rest) = input.split_first().ok_or(InvalidInstructionData)?;
        Ok(match tag {
            0 => {
                let bsc_address: [u8;32] = rest.try_into().ok().ok_or(InvalidInstructionData)?;
                Self::TransferIn { bsc_address }
            },
            1 => Self::TransferOut,
            _ => unreachable!()
        })
    }
}

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    /// number of greetings
    pub counter: u32,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

fn _process_transfer_in(program_id: &Pubkey, accounts: &[AccountInfo], bsc_address: &[u8; 32]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let token_program = next_account_info(account_info_iter)?;
    msg!("Checking if first account is a token program");
    if !cmp_pubkeys(&spl_token::ID, token_program.key) {
        return Err(OwnerMismatch.into());
    }

    let current_owner_account = next_account_info(account_info_iter)?;
    msg!("Checking if current token owner is a signer");
    if !current_owner_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let current_owner_token_account = next_account_info(account_info_iter)?;
    // We don't care about current_owner_account checks because
    // lots of checks will be performed by SPL token program.

    let new_owner_token_account = next_account_info(account_info_iter)?;
    use spl_token::state::Account;
    use solana_program::program_pack::Pack;
    let new_owner_token_account_deserialized = Account::unpack(&new_owner_token_account.data.borrow())?;
    // The account we are sending NFT to should be owned by SPL program (extenrally) and
    // by program_id internally.
    msg!("Checking if SPL owns new token account");
    if !cmp_pubkeys(&spl_token::ID, new_owner_token_account.owner) {
        return Err(OwnerMismatch.into());
    }
    msg!("Checking if program_id owns new token account");
    if !cmp_pubkeys(program_id, &new_owner_token_account_deserialized.owner) {
        return Err(OwnerMismatch.into());
    }

    let events_account = next_account_info(account_info_iter)?;
    // Events Account should be owned by the program as well.
    // This guarantees it is empty or changed only by this method.
    msg!("Checking events account");
    if !cmp_pubkeys(program_id, &events_account.owner) {
        return Err(OwnerMismatch.into());
    }

    msg!("All checks passed, transferring...");
    let ix = token_instruction::transfer(
        token_program.key,
        current_owner_token_account.key,
        new_owner_token_account.key,
        current_owner_account.key,
        &[],
        1,
    )?;
    invoke(
        &ix,
        &[
            current_owner_token_account.clone(),
            new_owner_token_account.clone(),
            current_owner_account.clone(),
            token_program.clone()
        ],
    )?;

    let event_queue = &mut events_account.data.borrow_mut();
    use ProgramError::InvalidInstructionData;
    let cur_event_queue_size: usize = usize::from_be_bytes(event_queue[0..8].try_into().ok().ok_or(InvalidInstructionData)?);
    let new_event_queue_size = cur_event_queue_size + 1;
    event_queue[0..8].clone_from_slice(&new_event_queue_size.to_be_bytes());
    event_queue[(8 + 32*cur_event_queue_size)..(8 + 32 * (cur_event_queue_size+1))].clone_from_slice(&bsc_address[..]);

    Ok(())
}

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    let instruction = TokenInstruction::unpack(_instruction_data)?;

    match instruction {
        TokenInstruction::TransferIn {
            bsc_address
        } => {
            msg!("Instruction: TransferIn");
            _process_transfer_in(program_id, accounts, &bsc_address)
        },
        TokenInstruction::TransferOut => {
            msg!("Instruction: TransferOut");
            Ok(())
        }
    }
/*
    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Increment and store the number of times the account has been greeted
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += 1;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Greeted {} time(s)!", greeting_account.counter);

    Ok(())
    */
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u32>()];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let instruction_data: Vec<u8> = Vec::new();

        let accounts = vec![account];

        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            0
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            1
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            2
        );
    }
}
