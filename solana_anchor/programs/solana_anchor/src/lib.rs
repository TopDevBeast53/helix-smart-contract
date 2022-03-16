use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, TokenAccount};
declare_id!("A7nCafiWF1mDUHYJxfXGaBX3vJm7XvzkUtgSe9R1kK9D");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8, capacity: u16) -> Result<()> {
        ctx.accounts.state_account.bump = bump;
        ctx.accounts.state_account.capacity = capacity;
        Ok(())
    }

    pub fn transfer_in(ctx: Context<TransferIn>, bsc_address: Pubkey) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        if state_account.bsc_address.len() >= state_account.capacity as usize {
            return Err(CustomeError::ListFull.into())
        }

        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }

        ctx.accounts.state_account.bsc_address.push(bsc_address);
        ctx.accounts.state_account.user_address.push(*ctx.accounts.owner.to_account_info().key);
        Ok(())
    }

    pub fn transfer_out(ctx: Context<TransferOut>) -> Result<()> {
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8, capacity: u16)]
pub struct Initialize<'info> {
    #[account(mut)]
    admin: Signer<'info>,
    #[account(init,space = ApprovedNFTs::space(capacity), seeds = [b"stateAccount".as_ref()], bump, payer = admin)]
    state_account: Account<'info, ApprovedNFTs>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferIn<'info> {
    #[account(mut, seeds = [b"stateAccount".as_ref()], bump = state_account.bump)]
    state_account: Account<'info, ApprovedNFTs>,
    from: Account<'info, TokenAccount>,
    to: Account<'info, TokenAccount>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferOut<'info> {
    from: Account<'info, TokenAccount>,
    to: Account<'info, TokenAccount>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[account]
pub struct ApprovedNFTs {
    bsc_address: Vec<Pubkey>,
    user_address: Vec<Pubkey>,
    bump: u8,
    capacity: u16
}

impl ApprovedNFTs {
    fn space(capacity: u16) -> usize {
        // discriminator + bump + capacity
        8 + 1 + 2 +
            // vec of item pubkeys
            4 + (capacity as usize) * std::mem::size_of::<Pubkey>() +
            // vec of item pubkeys
            4 + (capacity as usize) * std::mem::size_of::<Pubkey>()
    }
}

#[error]
pub enum CustomeError {
    #[msg("Owner can transfer the token")]
    IsNotOwner,
    #[msg("List is full")]
    ListFull
}