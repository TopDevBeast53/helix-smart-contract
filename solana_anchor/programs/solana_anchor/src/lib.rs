use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn transfer_in(ctx: Context<TransferIn>) -> Result<()> {
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.pool_signer.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }
        Ok(())
    }

    pub fn transfer_out(ctx: Context<TransferOut>) -> Result<()> {
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_signer.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    authority: ctx.accounts.pool_signer.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferIn<'info> {
    pool_signer: UncheckedAccount<'info>,
    user: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferOut<'info> {
    pool_signer: Signer<'info>,
    user: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
}

#[error]
pub enum CustomeError {
    #[msg("Owner can transfer the token")]
    IsNotOwner
}