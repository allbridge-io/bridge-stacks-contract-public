import { Clarinet, Tx, Chain, type Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const ERR_NOT_AUTHORIZED = 'u100';


Clarinet.test({
    name: "sip10-token trait readonly funcitons implemented",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
	
		let getoTotalSupply = chain.callReadOnlyFn(token_address, 'get-total-supply', [], deployer.address);
		getoTotalSupply.result.expectOk().expectUint(0);
		let getoName = chain.callReadOnlyFn(token_address, 'get-name', [], deployer.address);
		getoName.result.expectOk().expectAscii('Native Token');
		let getoSymbol = chain.callReadOnlyFn(token_address, 'get-symbol', [], deployer.address);
		getoSymbol.result.expectOk().expectAscii('nTOKEN');
		let getoDecimals = chain.callReadOnlyFn(token_address, 'get-decimals', [], deployer.address);
		getoDecimals.result.expectOk().expectUint(9);
		let getTokenURI = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURI.result.expectOk().expectSome().expectUtf8(''); // empty string
    },
});


Clarinet.test({
    name: "(set-token-uri) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
        
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
    name: "(set-token-uri) negative, only owner can set token uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
        
		let getTokenURIBefore = chain.callReadOnlyFn(token_address, 'get-token-uri', [], wallet_1.address);
		getTokenURIBefore.result.expectOk().expectSome().expectUtf8('');
        
		let expectedTokenURI = 'https://super.token/uri';
		let block = chain.mineBlock([
            Tx.contractCall(token_address, 'set-token-uri', [types.utf8(expectedTokenURI)], wallet_1.address),
        ]);
		
		assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_AUTHORIZED);

		let getTokenURIAfter = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURIAfter.result.expectOk().expectSome().expectUtf8('');
    },
});

Clarinet.test({
    name: "(set-precision) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.native-token`;
        
		let precisionBefore = chain.callReadOnlyFn(tokenAddress, 'get-decimals', [], deployer.address);
		precisionBefore.result.expectOk().expectUint(9);
        
		let expectedPrecision = 6;
		let block = chain.mineBlock([
            Tx.contractCall(tokenAddress, 'set-precision', [types.uint(expectedPrecision)], deployer.address),
        ]);
		assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk();

		let precisionAfter = chain.callReadOnlyFn(tokenAddress, 'get-decimals', [], deployer.address);
		precisionAfter.result.expectOk().expectUint(expectedPrecision);
    },
});


Clarinet.test({
    name: "(set-precision) negative, only owner can set token uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.native-token`;
        
		let precisionBefore = chain.callReadOnlyFn(tokenAddress, 'get-decimals', [], deployer.address);
		precisionBefore.result.expectOk().expectUint(9);
        
		let newPrecision = 6;
		let block = chain.mineBlock([
            Tx.contractCall(tokenAddress, 'set-precision', [types.uint(newPrecision)], wallet_1.address),
        ]);
		
		assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_AUTHORIZED);

		let precisionAfter = chain.callReadOnlyFn(tokenAddress, 'get-decimals', [], deployer.address);
		precisionAfter.result.expectOk().expectUint(9);
    },
});


Clarinet.test({
    name: "(set-token-uri) negative, url should be more than 0",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
        
		let getTokenURIBefore = chain.callReadOnlyFn(token_address, 'get-token-uri', [], wallet_1.address);
		getTokenURIBefore.result.expectOk().expectSome().expectUtf8('');
        
		let expectedTokenURI = '';
		let block = chain.mineBlock([
            Tx.contractCall(token_address, 'set-token-uri', [types.utf8(expectedTokenURI)], wallet_1.address),
        ]);
		
		assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_AUTHORIZED);

		let getTokenURIAfter = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURIAfter.result.expectOk().expectSome().expectUtf8('');
    },
});


Clarinet.test({
    name: "(mint) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let block = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000), 				
				types.none(),
			], deployer.address),
        ]);
		
		assertEquals(block.receipts.length, 1);
		block.receipts[0].result.expectOk();
		assertEquals(block.receipts[0].events.length, 3);
		block.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfter.assets, true);
		assertEquals(wallet_1.address in assetsAfter.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfter.assets[`.native-token.native-token`][wallet_1.address], 1000);
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
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

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
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000), 
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 1);
		blockMint.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterMint.assets[`.native-token.native-token`][wallet_1.address], 1000);
		
		let blockBurn = chain.mineBlock([
			Tx.contractCall(token_address, 'burn', [
				types.principal(wallet_1.address), 
				types.uint(500), 
				types.none(),
			], deployer.address),
        ]);

		assertEquals(blockBurn.receipts.length, 1);
		blockBurn.receipts[0].result.expectOk();
		assertEquals(blockBurn.receipts[0].events.length, 3);
		blockBurn.receipts[0].events.expectFungibleTokenBurnEvent(
			500,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterBurn = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterBurn.assets, true);
		assertEquals(wallet_1.address in assetsAfterBurn.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterBurn.assets[`.native-token.native-token`][wallet_1.address], 500);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(500);
    },
});


Clarinet.test({
    name: "(burn) negative - only owner can burn, native token",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000), 
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 1);
		blockMint.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterMint.assets[`.native-token.native-token`][wallet_1.address], 1000);
		
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(500), 
				types.principal(wallet_1.address),
				types.principal(deployer.address), 
				types.none(),
			], wallet_1.address),
        ]);

		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterBurn = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterBurn.assets, true);
		assertEquals(wallet_1.address in assetsAfterBurn.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterBurn.assets[`.native-token.native-token`][wallet_1.address], 500);
		assertEquals(assetsAfterBurn.assets[`.native-token.native-token`][deployer.address], 500);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(500);
    },
});


Clarinet.test({
	name: "(transfer) positive",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
		let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000), 
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 1);
		blockMint.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.native-token.native-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.native-token.native-token`], false);
		assertEquals(assetsAfterMint.assets[`.native-token.native-token`][wallet_1.address], 1000);
		
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
		assertEquals(".native-token.native-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterTransfer.assets[`.native-token.native-token`][wallet_1.address], 500);
		assertEquals(assetsAfterTransfer.assets[`.native-token.native-token`][wallet_2.address], 500);
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
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000), 
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 1);
		blockMint.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.native-token.native-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.native-token.native-token`], false);
		assertEquals(assetsAfterMint.assets[`.native-token.native-token`][wallet_1.address], 1000);
		
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
		assertEquals(".native-token.native-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.native-token.native-token`], true);
		assertEquals(wallet_2.address in assetsAfterTransfer.assets[`.native-token.native-token`], false);
		assertEquals(assetsAfterTransfer.assets[`.native-token.native-token`][wallet_1.address], 1000);
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
        let token_address = `${deployer.address}.native-token`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".native-token.native-token" in assetsBefore.assets, false);

		let blockMint = chain.mineBlock([
            Tx.contractCall(token_address, 'mint', [
				types.principal(wallet_1.address),
				types.uint(1000),
				types.none(),
			], deployer.address),
        ]);
		assertEquals(blockMint.receipts.length, 1);
		blockMint.receipts[0].result.expectOk();
		assertEquals(blockMint.receipts[0].events.length, 3);
		blockMint.receipts[0].events.expectFungibleTokenMintEvent(
			1000,
			wallet_1.address,
			`${deployer.address}.native-token::native-token`
		);
		let assetsAfterMint = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterMint.assets, true);
		assertEquals(wallet_1.address in assetsAfterMint.assets[`.native-token.native-token`], true);
		assertEquals(wallet_2.address in assetsAfterMint.assets[`.native-token.native-token`], false);
		assertEquals(assetsAfterMint.assets[`.native-token.native-token`][wallet_1.address], 1000);
		
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
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".native-token.native-token" in assetsAfterTransfer.assets, true);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`.native-token.native-token`], true);
		assertEquals(assetsAfterTransfer.assets[`.native-token.native-token`][wallet_1.address], 500);
		assertEquals(assetsAfterTransfer.assets[`.native-token.native-token`][wallet_2.address], 500);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(500);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_2.address)], wallet_1.address);
		balanceOfW2.result.expectOk().expectUint(500);
    },
});	