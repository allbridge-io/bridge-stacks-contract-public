import { Clarinet, Tx, Chain, type Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const ERR_NOT_AUTHORIZED = '10000';

Clarinet.test({
    name: "(set-contract-owner) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let token_address = `${deployer.address}.wrapped-token`;
        
		let getContractOwner = chain.callReadOnlyFn(token_address, 'get-contract-owner', [], deployer.address);
		getContractOwner.result.expectOk().expectPrincipal(deployer.address);

        let tokenBlock = chain.mineBlock([
            Tx.contractCall(token_address, 'set-contract-owner', [types.principal(wallet_1.address)], deployer.address)
        ]);

        assertEquals(tokenBlock.receipts.length,1);
        tokenBlock.receipts[0].result.expectOk().expectBool(true);

		let getChangedContractOwner = chain.callReadOnlyFn(token_address, 'get-contract-owner', [], deployer.address);
		getChangedContractOwner.result.expectOk().expectPrincipal(wallet_1.address);
    },
});

Clarinet.test({
    name: "(set-contract-owner) only owner can set owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let deployer_principle = types.principal(deployer.address);
        
        let tokenBlock = chain.mineBlock([
            Tx.contractCall(token_address, 'get-contract-owner', [], deployer.address),
            Tx.contractCall(token_address, 'set-contract-owner', [deployer_principle], deployer.address)
        ]);

        assertEquals(tokenBlock.receipts.length, 2);
        tokenBlock.receipts[0].result.expectOk().expectPrincipal(deployer.address);
        tokenBlock.receipts[1].result.expectOk().expectBool(true);

		let notOwner = accounts.get('wallet_1')!;
		let notOwner_principle = types.principal(notOwner.address);
        let tokenBlock2 = chain.mineBlock([
            Tx.contractCall(token_address, 'get-contract-owner', [], notOwner.address),
            Tx.contractCall(token_address, 'set-contract-owner', [notOwner_principle], notOwner.address)
        ]);

        assertEquals(tokenBlock2.receipts.length, 2);
        tokenBlock2.receipts[0].result.expectOk().expectPrincipal(deployer.address);
        tokenBlock2.receipts[1].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);
    },
});


Clarinet.test({
    name: "sip10-token trait readonly funcitons implemented",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
	
		let getoTotalSupply = chain.callReadOnlyFn(token_address, 'get-total-supply', [], deployer.address);
		getoTotalSupply.result.expectOk().expectUint(0);
		let getoName = chain.callReadOnlyFn(token_address, 'get-name', [], deployer.address);
		getoName.result.expectOk().expectAscii('Wrapped Token');
		let getoSymbol = chain.callReadOnlyFn(token_address, 'get-symbol', [], deployer.address);
		getoSymbol.result.expectOk().expectAscii('wTOKEN');
		let getoDecimals = chain.callReadOnlyFn(token_address, 'get-decimals', [], deployer.address);
		getoDecimals.result.expectOk().expectUint(8);
		let getTokenURI = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURI.result.expectOk().expectSome().expectUtf8(''); // empty string
    },
});

Clarinet.test({
    name: "(set-token-uri) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
        
		let getTokenURIBefore = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURIBefore.result.expectOk().expectSome().expectUtf8('');
        
		let expectedTokenURI = 'https://super.token/uri';
		chain.mineBlock([
            Tx.contractCall(token_address, 'set-token-uri', [types.utf8(expectedTokenURI)], deployer.address),
        ]);

		let getTokenURIAfter = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURIAfter.result.expectOk().expectSome().expectUtf8(expectedTokenURI);
    },
});

Clarinet.test({
    name: "(set-token-uri) negative - only owner can set token uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
        
		let getTokenURIBefore = chain.callReadOnlyFn(token_address, 'get-token-uri', [], wallet_1.address);
		getTokenURIBefore.result.expectOk().expectSome().expectUtf8('');
        
		let expectedTokenURI = 'https://super.token/uri';
		let block = chain.mineBlock([
            Tx.contractCall(token_address, 'set-token-uri', [types.utf8(expectedTokenURI)], wallet_1.address),
        ]);
		
		assertEquals(block.receipts.length, 1);
		block.receipts[0].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);

		let getTokenURIAfter = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURIAfter.result.expectOk().expectSome().expectUtf8('');
    },
});

Clarinet.test({
    name: "(mint) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		
		assertEquals(block.receipts.length, 2);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectOk();
		assertEquals(block.receipts[1].events.length, 3);
		block.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfter.assets, true);
		assertEquals(wallet_1.address in assetsAfter.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfter.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(1000);
    },
});


Clarinet.test({
    name: "(mint) negative - only owner can mint",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(wallet_2.address), 
				types.principal(wallet_1.address),
				types.none(),
			], wallet_2.address),
        ]);
		assertEquals(block.receipts.length, 2);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectErr();
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(0);
    },
});

Clarinet.test({
    name: "(burn) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 2);
		blockMint.receipts[0].result.expectOk();
		blockMint.receipts[1].result.expectOk();
		assertEquals(blockMint.receipts[1].events.length, 3);
		blockMint.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterMint.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		
		let blockBurn = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500), 
				types.principal(wallet_1.address),
				types.principal(deployer.address), 
				types.none(),
			], deployer.address),
        ]);

		assertEquals(blockBurn.receipts.length, 1);
		blockBurn.receipts[0].result.expectOk();
		assertEquals(blockBurn.receipts[0].events.length, 3);
		blockBurn.receipts[0].events.expectFungibleTokenBurnEvent(
			500,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterBurn = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterBurn.assets, true);
		assertEquals(wallet_1.address in assetsAfterBurn.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterBurn.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 500);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(500);
    },
});

Clarinet.test({
    name: "(burn) negative - only owner can burn",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 2);
		blockMint.receipts[0].result.expectOk();
		blockMint.receipts[1].result.expectOk();
		assertEquals(blockMint.receipts[1].events.length, 3);
		blockMint.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterMint.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		
		let blockBurn = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500), 
				types.principal(wallet_1.address),
				types.principal(deployer.address), 
				types.none(),
			], wallet_1.address),
        ]);

		assertEquals(blockBurn.receipts.length, 1);
		blockBurn.receipts[0].result.expectErr();
		let assetsAfterBurn = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterBurn.assets, true);
		assertEquals(wallet_1.address in assetsAfterBurn.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterBurn.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(1000);
    },
});

Clarinet.test({
	name: "(transfer) positive",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
		let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 2);
		blockMint.receipts[0].result.expectOk();
		blockMint.receipts[1].result.expectOk();
		assertEquals(blockMint.receipts[1].events.length, 3);
		blockMint.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], false);
		assertEquals(assetsAfterMint.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500), 
				types.principal(wallet_1.address),
				types.principal(wallet_2.address), 
				types.none(),
			], wallet_1.address),
        ]);
		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectOk();
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 500);
		assertEquals(assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`][wallet_2.address], 500);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(500);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_2.address)], wallet_1.address);
		balanceOfW2.result.expectOk().expectUint(500);
    },
});	

Clarinet.test({
	name: "(transfer) negative, only holder can transfer own tokens",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
		let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 2);
		blockMint.receipts[0].result.expectOk();
		blockMint.receipts[1].result.expectOk();
		assertEquals(blockMint.receipts[1].events.length, 3);
		blockMint.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], false);
		assertEquals(assetsAfterMint.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500), 
				types.principal(wallet_1.address),
				types.principal(wallet_2.address), 
				types.none(),
			], wallet_2.address),
        ]);
		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectErr();
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(wallet_2.address in assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`], false);
		assertEquals(assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(1000);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_2.address)], wallet_1.address);
		balanceOfW2.result.expectOk().expectUint(0);
    },
});

Clarinet.test({
	name: "(transfer) positive with memo",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
		let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wrapped-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wrapped-token.wrapped-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(deployer.address),
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 2);
		blockMint.receipts[0].result.expectOk();
		blockMint.receipts[1].result.expectOk();
		assertEquals(blockMint.receipts[1].events.length, 3);
		blockMint.receipts[1].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.wrapped-token::wrapped-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.wrapped-token.wrapped-token`], false);
		assertEquals(assetsAfterMint.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 1000);

		const memo = Buffer.from("ThisCanBeAnyTextUpTo_32_BytesLong.", "utf-8");
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500),
				types.principal(wallet_1.address),
				types.principal(wallet_2.address),
				types.some(types.buff(memo)),
			], wallet_1.address),
        ]);
		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectOk();
		blockTransfer.receipts[0].events.expectPrintEvent(token_address, types.some(types.buff(memo)));
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wrapped-token.wrapped-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`], true);
		assertEquals(assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`][wallet_1.address], 500);
		assertEquals(assetsAfterTransfer.assets[`.wrapped-token.wrapped-token`][wallet_2.address], 500);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(500);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_2.address)], wallet_1.address);
		balanceOfW2.result.expectOk().expectUint(500);
    },
});