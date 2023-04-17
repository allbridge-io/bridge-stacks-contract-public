import { Clarinet, Tx, Chain, type Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const ERR_NOT_AUTHORIZED = 'u100';

Clarinet.test({
    name: "(set-contract-owner) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let token_address = `${deployer.address}.wstx`;
        
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
        let token_address = `${deployer.address}.wstx`;
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
        assertEquals(tokenBlock2.receipts[1].result.expectErr(), ERR_NOT_AUTHORIZED);
    },
});

Clarinet.test({
    name: "sip10-token trait readonly funcitons implemented",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
	
		let getoTotalSupply = chain.callReadOnlyFn(token_address, 'get-total-supply', [], deployer.address);
		getoTotalSupply.result.expectOk().expectUint(0);
		let getoName = chain.callReadOnlyFn(token_address, 'get-name', [], deployer.address);
		getoName.result.expectOk().expectAscii('Wrapped STX');
		let getoSymbol = chain.callReadOnlyFn(token_address, 'get-symbol', [], deployer.address);
		getoSymbol.result.expectOk().expectAscii('wstx');
		let getoDecimals = chain.callReadOnlyFn(token_address, 'get-decimals', [], deployer.address);
		getoDecimals.result.expectOk().expectUint(6);
		let getTokenURI = chain.callReadOnlyFn(token_address, 'get-token-uri', [], deployer.address);
		getTokenURI.result.expectOk().expectSome().expectUtf8(''); // empty string
    },
});

Clarinet.test({
    name: "(set-token-uri) positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        
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
        let token_address = `${deployer.address}.wstx`;
        
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
    name: "(transfer) positive, from bridge to wallet",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

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
		assertEquals(block.receipts[1].events.length, 1);
		block.receipts[1].events.expectSTXTransferEvent(
			1000,
			deployer.address,
			wallet_1.address
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfter.assets, false);
		assertEquals(assetsAfter.assets[`STX`][wallet_1.address], 100000000001000);
		let balanceOf = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOf.result.expectOk().expectUint(100000000001000);
    },
});
Clarinet.test({
    name: "(transfer) negative, only bridge can transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

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
		balanceOf.result.expectOk().expectUint(100000000000000);
    },
});

Clarinet.test({
	name: "(transfer) positive",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(deployer.address), 
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
			Tx.contractCall('wstx', 'approve-contract', [types.principal(wallet_1.address)], deployer.address),
        ]);
		assertEquals(block.receipts.length, 3);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectOk();
		block.receipts[2].result.expectOk();
		assertEquals(block.receipts[1].events.length, 1);
		block.receipts[1].events.expectSTXTransferEvent(
			1000,
			deployer.address,
			wallet_1.address,
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfter.assets, false);
		assertEquals(assetsAfter.assets[`STX`][wallet_1.address], 100000000001000);
		let balanceSender = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceSender.result.expectOk().expectUint(100000000001000);
		assertEquals(assetsAfter.assets[`STX`][deployer.address], 99999999999000);
		let balanceBridge = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], wallet_1.address);
		balanceBridge.result.expectOk().expectUint(99999999999000);
		
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(1000), 
				types.principal(wallet_1.address), 
				types.principal(deployer.address),
				types.none(),
			], wallet_1.address),
        ]);
		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectOk();
		blockTransfer.receipts[0].events.expectSTXTransferEvent(
			1000,
			wallet_1.address,
			deployer.address,
		);
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfterTransfer.assets, false);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_1.address], 100000000000000);
		assertEquals(assetsAfterTransfer.assets[`STX`][deployer.address], 100000000000000);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(100000000000000);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], deployer.address);
		balanceOfW2.result.expectOk().expectUint(100000000000000);
    },
});	

Clarinet.test({
	name: "(transfer) negative, only holder can transfer own tokens",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
		let wallet_2 = accounts.get('wallet_2')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
        ]);
		assertEquals(block.receipts.length, 1);
		block.receipts[0].result.expectOk();

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
		assertEquals(".wstx.wstx" in assetsAfterTransfer.assets, false);
		assertEquals(wallet_1.address in assetsAfterTransfer.assets[`STX`], true);
		assertEquals(wallet_2.address in assetsAfterTransfer.assets[`STX`], true);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_1.address], 100000000000000);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_2.address], 100000000000000);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(100000000000000);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_2.address)], wallet_1.address);
		balanceOfW2.result.expectOk().expectUint(100000000000000);
    },
});

Clarinet.test({
	name: "(transfer) negative, wstx must be approved",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(deployer.address),
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
        ]);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectOk();

		assertEquals(block.receipts[1].events.length, 1);
		block.receipts[1].events.expectSTXTransferEvent(
			1000,
			deployer.address,
			wallet_1.address,
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfter.assets, false);
		assertEquals(assetsAfter.assets[`STX`][wallet_1.address], 100000000001000);
		let balanceSender = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceSender.result.expectOk().expectUint(100000000001000);
		assertEquals(assetsAfter.assets[`STX`][deployer.address], 99999999999000);
		let balanceBridge = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], wallet_1.address);
		balanceBridge.result.expectOk().expectUint(99999999999000);

		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(wallet_1.address),
				types.principal(deployer.address),
				types.none(),
			], wallet_1.address),
        ]);
		assertEquals(blockTransfer.receipts.length, 1);
        assertEquals(blockTransfer.receipts[0].result.expectErr(), ERR_NOT_AUTHORIZED);

		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfterTransfer.assets, false);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_1.address], 100000000001000);
		assertEquals(assetsAfterTransfer.assets[`STX`][deployer.address], 99999999999000);

		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(100000000001000);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], deployer.address);
		balanceOfW2.result.expectOk().expectUint(99999999999000);
    },
});


Clarinet.test({
	name: "(transfer) negative, no transfers after disapprove-contract",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();
		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(deployer.address),
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
			Tx.contractCall('wstx', 'approve-contract', [types.principal(wallet_1.address)], deployer.address),
        ]);
		assertEquals(block.receipts.length, 3);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectOk();
		block.receipts[2].result.expectOk();
		assertEquals(block.receipts[1].events.length, 1);
		block.receipts[1].events.expectSTXTransferEvent(
			1000,
			deployer.address,
			wallet_1.address,
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfter.assets, false);
		assertEquals(assetsAfter.assets[`STX`][wallet_1.address], 100000000001000);

		let balanceSender = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceSender.result.expectOk().expectUint(100000000001000);
		assertEquals(assetsAfter.assets[`STX`][deployer.address], 99999999999000);

		let balanceBridge = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], wallet_1.address);
		balanceBridge.result.expectOk().expectUint(99999999999000);

		let blockTransfer_1 = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(wallet_1.address),
				types.principal(deployer.address),
				types.none(),
			], wallet_1.address),
        ]);
		assertEquals(blockTransfer_1.receipts.length, 1);
		blockTransfer_1.receipts[0].result.expectOk();
		blockTransfer_1.receipts[0].events.expectSTXTransferEvent(
			1000,
			wallet_1.address,
			deployer.address,
		);
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfterTransfer.assets, false);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_1.address], 100000000000000);
		assertEquals(assetsAfterTransfer.assets[`STX`][deployer.address], 100000000000000);

		let balanceOfW1_1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1_1.result.expectOk().expectUint(100000000000000);
		let balanceOfW2_1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], deployer.address);
		balanceOfW2_1.result.expectOk().expectUint(100000000000000);

		let blockTransfer_2 = chain.mineBlock([
			Tx.contractCall('wstx', 'disapprove-contract', [types.principal(wallet_1.address)], deployer.address),
			Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(wallet_1.address),
				types.principal(deployer.address),
				types.none(),
			], wallet_1.address),
        ]);

		blockTransfer_2.receipts[0].result.expectOk();
        assertEquals(blockTransfer_2.receipts[1].result.expectErr(), ERR_NOT_AUTHORIZED);

		let assetsAfterDisapprove = chain.getAssetsMaps();
		assertEquals(assetsAfterDisapprove.assets[`STX`][wallet_1.address], 100000000000000);
		assertEquals(assetsAfterDisapprove.assets[`STX`][deployer.address], 100000000000000);

		let balanceOfW1_2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1_2.result.expectOk().expectUint(100000000000000);
		let balanceOfW2_2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], deployer.address);
		balanceOfW2_2.result.expectOk().expectUint(100000000000000);
    },
});


Clarinet.test({
	name: "(transfer) positive with memo",
	async fn(chain: Chain, accounts: Map<string, Account>) {
		let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
		let assetsBefore = chain.getAssetsMaps();

		assertEquals("STX" in assetsBefore.assets, true);
		assertEquals(".wstx.wstx" in assetsBefore.assets, false);

		let block = chain.mineBlock([
			Tx.contractCall(token_address, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(deployer.address),
				types.principal(wallet_1.address),
				types.none(),
			], deployer.address),
			Tx.contractCall('wstx', 'approve-contract', [types.principal(wallet_1.address)], deployer.address),
        ]);
		assertEquals(block.receipts.length, 3);
		block.receipts[0].result.expectOk();
		block.receipts[1].result.expectOk();
		block.receipts[2].result.expectOk();
		assertEquals(block.receipts[1].events.length, 1);
		block.receipts[1].events.expectSTXTransferEvent(
			1000,
			deployer.address,
			wallet_1.address,
		);
		let assetsAfter = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfter.assets, false);
		assertEquals(assetsAfter.assets[`STX`][wallet_1.address], 100000000001000);
		let balanceSender = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceSender.result.expectOk().expectUint(100000000001000);
		assertEquals(assetsAfter.assets[`STX`][deployer.address], 99999999999000);
		let balanceBridge = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], wallet_1.address);
		balanceBridge.result.expectOk().expectUint(99999999999000);

		const memo = Buffer.from("ThisCanBeAnyTextUpTo_32_BytesLong.", "utf-8");
		let blockTransfer = chain.mineBlock([
			Tx.contractCall(token_address, 'transfer', [
				types.uint(1000),
				types.principal(wallet_1.address),
				types.principal(deployer.address),
				types.some(types.buff(memo)),
			], wallet_1.address),
        ]);

		assertEquals(blockTransfer.receipts.length, 1);
		blockTransfer.receipts[0].result.expectOk();
		assertEquals(blockTransfer.receipts[0].events[0]['stx_transfer_event']['memo'], memo.toString('hex'));
		blockTransfer.receipts[0].events.expectSTXTransferEvent(
			1000,
			wallet_1.address,
			deployer.address,
		);
		let assetsAfterTransfer = chain.getAssetsMaps();
		assertEquals(".wstx.wstx" in assetsAfterTransfer.assets, false);
		assertEquals(assetsAfterTransfer.assets[`STX`][wallet_1.address], 100000000000000);
		assertEquals(assetsAfterTransfer.assets[`STX`][deployer.address], 100000000000000);
		let balanceOfW1 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
		balanceOfW1.result.expectOk().expectUint(100000000000000);
		let balanceOfW2 = chain.callReadOnlyFn(token_address, 'get-balance', [types.principal(deployer.address)], deployer.address);
		balanceOfW2.result.expectOk().expectUint(100000000000000);
    },
});