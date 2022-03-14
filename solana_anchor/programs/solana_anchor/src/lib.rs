use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        ctx.accounts.state_account.bump = bump;
        Ok(())
    }

    pub fn transfer_in(ctx: Context<TransferIn>, bsc_address: Pubkey) -> Result<()> {
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.pool.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }

        ctx.accounts.state_account.bsc_address = bsc_address;
        ctx.accounts.state_account.user_address = *ctx.accounts.user.to_account_info().key;
        Ok(())
    }

    pub fn transfer_out(ctx: Context<TransferOut>) -> Result<()> {
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, seeds = [b"state_account".as_ref()], bump, payer = pool)]
    state_account: Account<'info, ApprovedNFTs>,
    pool: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferIn<'info> {
    #[account(mut, seeds = [b"state_account".as_ref()], bump = state_account.bump)]
    state_account: Account<'info, ApprovedNFTs>,
    pool: UncheckedAccount<'info>,
    user: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferOut<'info> {
    pool: Signer<'info>,
    user: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct ApprovedNFTs {
    bsc_address: Pubkey,
    user_address: Pubkey,
    bump: u8,
}

#[error]
pub enum CustomeError {
    #[msg("Owner can transfer the token")]
    IsNotOwner
}