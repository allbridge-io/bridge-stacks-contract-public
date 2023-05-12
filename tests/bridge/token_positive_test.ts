import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const CHAIN_OTHER = '0x11223344';
const CHAIN_OTHER_1 = '0x11223345';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE_ADDRESS_1 = '0x1133334455667788990011223344556677889900112233445566778899001122';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;
const TOKEN_SOURCE_1 = `0x${CHAIN_OTHER_1.replace('0x', '')}${TOKEN_SOURCE_ADDRESS_1.replace('0x', '')}`;

const ERR_TOKEN_ALREADY_EXISTS = 10000;
const ERR_TOKEN_DOES_NOT_EXIST = 10001;

Clarinet.test({
    name: "(add-token) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);
        let unknownTokenAddress = `${deployer.address}.wrapped-token`;
        let unknownTokenPrincipal = types.principal(unknownTokenAddress);
        let tokenType = types.uint(100);
        let minFee = types.uint(100000);

        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE_1
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [unknownTokenPrincipal], deployer.address),
        ]);
        // 0: Bridge contract owner set
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Successful query by source
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(), 
            {address: tokenAddress}
        );
        // 3: Successful query by native address
        assertEquals(
            block.receipts[3].result.expectOk().expectTuple(), 
            {
                'precision': 'u6',
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFee,
            }
        );
        // 4: Querying non-existing token by source
        block.receipts[4].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 5: Querying non-existing token by address
        block.receipts[5].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});

Clarinet.test({
    name: "(remove-token) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_9 = accounts.get('wallet_9')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);
        let tokenType = types.uint(100);
        let minFee = types.uint(100000);

        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
            Tx.contractCall('bridge', 'set-fee-collector', [types.principal(wallet_1.address)], deployer.address),
            Tx.transferSTX(10_000_000, `${deployer.address}.bridge`, deployer.address),
        ]);
        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Fee collector set
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: STX transfered to bridge
        block.receipts[2].result.expectOk().expectBool(true);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets']["STX"][`${deployer.address}.bridge`], (10_000_000));

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        // 0: Token removed
        block2.receipts[0].result.expectOk();

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][`${deployer.address}.bridge`], (0));
        assertEquals(assetsAfter['assets']["STX"][wallet_9.address], (100_000_010_000_000));

        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
        ]);
        // 0: Querying removed token by source
        block3.receipts[0].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 1: Querying removed by native address
        block3.receipts[1].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});

Clarinet.test({
    name: "(add-token) positive, not possible to add same token twice, native token (SIP-010) ",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.native-token`;
        let tokenPrincipal = types.principal(tokenAddress);
        let tokenType = types.uint(200);
        let tokenPrecision = types.uint(9);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE_1,
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [types.principal(deployer.address)], deployer.address),
        ]);
        // 0: Bridge contract owner set
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Successful query by source
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(),
            {address: tokenAddress}
        );
        // 3: Successful query by native address
        assertEquals(
            block.receipts[3].result.expectOk().expectTuple(),
            {
                'precision': tokenPrecision,
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFee,
            }
        );
        // 4: Querying non-existing token by source
        block.receipts[4].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 5: Querying non-existing token by address
        block.receipts[5].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                types.principal(`${deployer.address}.istx`),
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE_1,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
        ]);
        // 0: Adding token with existing source
        block2.receipts[0].result.expectErr().expectUint(ERR_TOKEN_ALREADY_EXISTS);
        // 1: Adding token with existing address
        block2.receipts[1].result.expectErr().expectUint(ERR_TOKEN_ALREADY_EXISTS);
    },
});

Clarinet.test({
    //SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token
    name: "(add-token) positive, native token (SIP-010) ",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.native-token`;
        let tokenPrincipal = types.principal(tokenAddress);
        let tokenType = types.uint(200);
        let tokenPrecision = types.uint(9);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-contract-owner', [types.principal(deployer.address)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE_1,
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [types.principal(deployer.address)], deployer.address),
        ]);
        // 0: Bridge contract owner set
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Successful query by source
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(), 
            {address: tokenAddress}
        );
        // 3: Successful query by native address
        assertEquals(
            block.receipts[3].result.expectOk().expectTuple(), 
            {
                'precision': tokenPrecision,
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFee,
            }
        );
        // 4: Querying non-existing token by source
        block.receipts[4].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 5: Querying non-existing token by address
        block.receipts[5].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});


Clarinet.test({
    name: "(remove-token) positive, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_9 = accounts.get('wallet_9')!;
        let wallet_3 = accounts.get('wallet_3')!;
        let tokenPrincipal = types.principal(`${deployer.address}.native-token`);
        let tokenType = types.uint(200);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
            Tx.contractCall('native-token', 'mint', [
                types.principal(`${deployer.address}.bridge`),
				types.uint(10000000000), 
				types.none(),
			], deployer.address),
            Tx.contractCall(`${deployer.address}.native-token`, 'set-contract-owner', [types.principal(wallet_3.address)], deployer.address),
        ]);
        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Transfer successful
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Contract owner set
        block.receipts[2].result.expectOk().expectBool(true);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(".native-token.native-token" in assetsBefore['assets'], true);
        assertEquals(wallet_9.address in assetsBefore['assets'][".native-token.native-token"], false);
        assertEquals(assetsBefore['assets'][".native-token.native-token"][`${deployer.address}.bridge`], (10000000000));
        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        // 0: Token removed
        block2.receipts[0].result.expectOk();
        block2.receipts[0].events.expectFungibleTokenTransferEvent(
            10000000000,
            `${deployer.address}.bridge`,
            wallet_9.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(".native-token.native-token" in assetsBefore['assets'], true);
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_9.address], (10000000000));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][`${deployer.address}.bridge`], (0));

        let tokenOwnerAfter = chain.callReadOnlyFn(`${deployer.address}.native-token`, 'get-contract-owner', [], deployer.address);
        tokenOwnerAfter.result.expectOk().expectPrincipal(wallet_3.address);

        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE_1,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        // 0: Querying removed token by source
        block3.receipts[0].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 1: Querying removed by native address
        block3.receipts[1].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 2: Adding existing token
        block3.receipts[2].result.expectOk().expectBool(true);
        // 3: Removing non-existing token
        block3.receipts[3].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});


Clarinet.test({
    name: "(add-token) positive, wrapped token (SIP-010) ",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.wrapped-token`;
        let tokenPrincipal = types.principal(tokenAddress);
        let tokenType = types.uint(300);
        let tokenPrecision = types.uint(8);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.wrapped-token`, 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [
                TOKEN_SOURCE_1,
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [types.principal(deployer.address)], deployer.address),
        ]);
        // 0: Bridge contract owner set
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Successful query by source
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(), 
            {address: tokenAddress}
        );
        // 3: Successful query by native address
        assertEquals(
            block.receipts[3].result.expectOk().expectTuple(), 
            {
                'precision': tokenPrecision,
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFee,
            }
        );
        // 4: Querying non-existing token by source
        block.receipts[4].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 5: Querying non-existing token by address
        block.receipts[5].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});

Clarinet.test({
    name: "(remove-token) positive, wrapped token (wTOKEN)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_9 = accounts.get('wallet_9')!;
        let tokenPrincipal = types.principal(`${deployer.address}.wrapped-token`);
        let tokenPrecision = types.uint(8);
        let tokenType = types.uint(300);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall('wrapped-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
        ]);
        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);

        let tokenOwnerBefore = chain.callReadOnlyFn(`${deployer.address}.wrapped-token`, 'get-contract-owner', [], deployer.address);
        tokenOwnerBefore.result.expectOk().expectPrincipal(`${deployer.address}.bridge`);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(".wrapped-token.wrapped-token" in assetsBefore['assets'], false);

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        // 0: Token removed
        block2.receipts[0].result.expectOk();

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(".wrapped-token.wrapped-token" in assetsAfter['assets'], false);

        let tokenOwnerAfter = chain.callReadOnlyFn(`${deployer.address}.wrapped-token`, 'get-contract-owner', [], deployer.address);
        tokenOwnerAfter.result.expectOk().expectPrincipal(wallet_9.address);

        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
        ]);
        // 0: Querying removed token by source
        block3.receipts[0].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
        // 1: Querying removed by native address
        block3.receipts[1].result.expectErr().expectUint(ERR_TOKEN_DOES_NOT_EXIST);
    },
});

Clarinet.test({
    name: "(set-fee) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);
        let tokenPrecision = types.uint(6);
        let tokenType = types.uint(100);
        let minFee = types.uint(100000);
        let minFeeChanged = types.uint(200000);
        
        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                tokenPrincipal,
                tokenType,
                minFee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
        ]);

        // 0: Token added
        assertEquals(block.receipts[0].result.expectOk(), 'true');
        // 1: Successful query by source
        assertEquals(
            block.receipts[1].result.expectOk().expectTuple(),
            {address: tokenAddress}
        );
        // 2: Successful query by native address
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(),
            {
                'precision': tokenPrecision,
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFee,
            }
        );
        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'set-token-min-fee', [tokenPrincipal, minFeeChanged], deployer.address)
        ]);
        block2.receipts[0].result.expectOk().expectBool(true);
        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
        ]);
        // 0: Successful query by native address
        assertEquals(
            block3.receipts[0].result.expectOk().expectTuple(),
            {
                'precision': tokenPrecision,
                'token-source': TOKEN_SOURCE,
                'token-type': tokenType,
                'min-fee': minFeeChanged,
            }
        );
    },
});