use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, TokenAccount};
declare_id!("A7nCafiWF1mDUHYJxfXGaBX3vJm7XvzkUtgSe9R1kK9D");

#[program]
pub mod solana_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8, capacity: u16) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        state_account.bump = bump;
        state_account.capacity = capacity;
        Ok(())
    }

    pub fn transfer_in(ctx: Context<TransferIn>, bsc_address: [u8;40]) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        if state_account.addresses.len() >= state_account.capacity as usize {
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

        ctx.accounts.state_account.addresses.push(
            Addresses {
                bsc_address: bsc_address,
                user_address: *ctx.accounts.owner.to_account_info().key,
                token_address: *ctx.accounts.to.to_account_info().key
            }
        );
        Ok(())
    }

    pub fn transfer_out(ctx: Context<TransferOut>, bsc_address: [u8;40]) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;

        let from = ctx.accounts.to.to_account_info().key;
        let to = ctx.accounts.to.to_account_info().key;
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.to.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, 1)?;
        }

        state_account.addresses.retain(|a| a.bsc_address != bsc_address && a.user_address != *to && a.token_address != *from);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8, capacity: u16)]
pub struct Initialize<'info> {
    #[account(mut)]
    admin: Signer<'info>,
    #[account(init,space = ApprovedNFTs::space(capacity), seeds = [b"test6".as_ref()], bump, payer = admin)]
    state_account: Account<'info, ApprovedNFTs>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferIn<'info> {
    #[account(mut, seeds = [b"test6".as_ref()], bump = state_account.bump)]
    state_account: Account<'info, ApprovedNFTs>,
    #[account(mut)]
    from: Account<'info, TokenAccount>,
    #[account(mut)]
    to: Account<'info, TokenAccount>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferOut<'info> {
    #[account(mut, seeds = [b"test6".as_ref()], bump = state_account.bump)]
    state_account: Account<'info, ApprovedNFTs>,
    #[account(mut)]
    from: Account<'info, TokenAccount>,
    #[account(mut)]
    to: Account<'info, TokenAccount>,
    owner: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[account]
pub struct ApprovedNFTs {
    bump: u8,
    capacity: u16,
    addresses: Vec<Addresses>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Addresses {
    bsc_address: [u8;40],
    user_address: Pubkey,
    token_address: Pubkey
}

impl ApprovedNFTs {
    fn space(capacity: u16) -> usize {
        // discriminator 
        8 + 
        // vec of item pubkeys + bsc address
        4 + (capacity as usize) * std::mem::size_of::<Pubkey>() * 2 + 40 + 
        // + bump + capacity
        1 + 2
    }
}

#[error]
pub enum CustomeError {
    #[msg("Owner can transfer the token")]
    IsNotOwner,
    #[msg("List is full")]
    ListFull
}