use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, TokenAccount};
declare_id!("FuBxmm2UnSFozHjwPAJRi7meii4HeQ4tcy3gCCdTKmXK");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn transfer_in(ctx: Context<TransferIn>, bsc_address: [u8;40]) -> Result<()> {
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

        emit!(TransferInEvent {
            bsc: bsc_address,
            owner: *ctx.accounts.owner.to_account_info().key,
            token: *ctx.accounts.mint.to_account_info().key,
            label: "NFT approved!".to_string(),
        });
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
pub struct TransferIn<'info> {
    #[account(mut)]
    from: Account<'info, TokenAccount>,
    #[account(mut)]
    to: Account<'info, TokenAccount>,
    mint: AccountInfo<'info>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferOut<'info> {
    #[account(mut)]
    from: Account<'info, TokenAccount>,
    #[account(mut)]
    to: Account<'info, TokenAccount>,
    mint: AccountInfo<'info>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[event]
pub struct TransferInEvent {
    pub bsc: [u8;40],
    pub owner: Pubkey,
    pub token: Pubkey,
    #[index]
    pub label: String,
}

#[error]
pub enum CustomeError {
    #[msg("Owner can transfer the token")]
    IsNotOwner,
}