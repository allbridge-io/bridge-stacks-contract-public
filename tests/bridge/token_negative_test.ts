import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;


const ERR_TOKEN_EXISTS = 'u10000';
const ERR_NOT_ALLOWED = 'u10002';
const ERR_WRONG_TOKEN_SOURCE = 'u10015';
const ERR_WRONG_TOKEN_ADDRESS = 'u10016';
const ERR_TOKEN_DOES_NOT_EXIST = 'u10001';

Clarinet.test({
    name: "(add-token) negative, wrong authority, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let wallet_1 = accounts.get('wallet_1')!;
        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, 'u100', 'u100000'], wallet_1.address),
        ]);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);
    },
});

Clarinet.test({
    name: "(add-token) negative, wrong chain type, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [`0x00${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`, tokenPrincipal, 'u100', 'u100000'], deployer.address),
        ]);
        assertEquals(block.receipts[0].result.expectErr(), ERR_WRONG_TOKEN_SOURCE);
    },
});

Clarinet.test({
    name: "(add-token) negative, wrong token source address type, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [`0x${CHAIN_OTHER.replace('0x', '')}00`, tokenPrincipal, 'u100', 'u100000'], deployer.address),
        ]);
        assertEquals(block.receipts[0].result.expectErr(), ERR_WRONG_TOKEN_SOURCE);
    },
});

Clarinet.test({
    name: "(add-token) negative, base token already added",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);
        let minFee = types.uint(100000);
        
        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, 'u100', minFee], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, 'u100', minFee], deployer.address),
        ]);
        assertEquals(block.receipts[0].result.expectOk(), 'true');
        assertEquals(block.receipts[1].result.expectErr(), ERR_TOKEN_EXISTS);
    },
});

Clarinet.test({
    name: "(add-token) negative, wrong authority, wrapped token (wTOKEN)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, types.principal(`${deployer.address}.wrapped-token`), 'u300', 'u100000'], wallet_1.address),
        ]);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);
    },
});

Clarinet.test({
    name: "(add-token) negative, wrapped token (wTOKEN) already added",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenPrincipal = types.principal(`${deployer.address}.wrapped-token`)
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.wrapped-token`, 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, 'u300', minFee], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, tokenPrincipal, 'u300', minFee], deployer.address),
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectBool(true);
        assertEquals(block.receipts[2].result.expectErr(), ERR_TOKEN_EXISTS);
    },
});

Clarinet.test({
    name: "(add-token) negative, wrong authority, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let tokenPrincipal = types.principal(`${deployer.address}.native-token`);
        let tokenType = types.uint(200);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], wallet_1.address),
        ]);
        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);
    },
});

Clarinet.test({
    name: "(add-token) negative, native token (SIP-010) already added",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let tokenPrincipal = types.principal(`${deployer.address}.native-token`)
        let tokenType = types.uint(200);
        let minFee = types.uint(100000);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, tokenPrincipal, tokenType, minFee], deployer.address),
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
        assertEquals(block.receipts[1].result.expectErr(), ERR_TOKEN_EXISTS);
    },
});

Clarinet.test({
    name: "(remove-token) negative, wrong authority, base token (STX)",
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
            Tx.transferSTX(10_000_000, `${deployer.address}.bridge`, deployer.address),
        ]);
        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: STX transfered to bridge
        block.receipts[1].result.expectOk().expectBool(true);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets']["STX"][`${deployer.address}.bridge`], (10_000_000));

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], wallet_1.address),
        ]);
        assertEquals(block2.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][`${deployer.address}.bridge`], (10_000_000));
    },
});

Clarinet.test({
    name: "(remove-token) negative, removing a token that does not exist, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;

        let wallet_9 = accounts.get('wallet_9')!;
        let tokenAddress = `${deployer.address}.istx`;
        let tokenPrincipal = types.principal(tokenAddress);
        
        let block1 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [tokenPrincipal], deployer.address),
        ]);
        assertEquals(block1.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);
        assertEquals(block1.receipts[1].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        assertEquals(block2.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);

    },
});


Clarinet.test({
    name: "(remove-token) negative, wrong authority, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

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
        assertEquals(assetsBefore['assets'][".native-token.native-token"][`${deployer.address}.bridge`], (10_000_000_000));
        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], wallet_1.address),
        ]);
        assertEquals(block2.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(".native-token.native-token" in assetsBefore['assets'], true);
        assertEquals(wallet_9.address in assetsBefore['assets'][".native-token.native-token"], false);
        assertEquals(assetsAfter['assets'][".native-token.native-token"][`${deployer.address}.bridge`], (10_000_000_000));

    },
});

Clarinet.test({
    name: "(remove-token) negative, removing a token that does not exist, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_9 = accounts.get('wallet_9')!;
        let tokenPrincipal = types.principal(`${deployer.address}.native-token`);

        let block1 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        assertEquals(block1.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);
    },
});

Clarinet.test({
    name: "(remove-token) negative, wrong authority, wrapped token (wTOKEN)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let wallet_9 = accounts.get('wallet_9')!;
        let tokenPrincipal = types.principal(`${deployer.address}.wrapped-token`);
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
            ], wallet_1.address),
        ]);
        assertEquals(block2.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(".wrapped-token.wrapped-token" in assetsAfter['assets'], false);

        let tokenOwnerAfter = chain.callReadOnlyFn(`${deployer.address}.wrapped-token`, 'get-contract-owner', [], deployer.address);
        tokenOwnerAfter.result.expectOk().expectPrincipal(`${deployer.address}.bridge`);

    },
});

Clarinet.test({
    name: "(remove-token) positive, wrapped token (wTOKEN)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_9 = accounts.get('wallet_9')!;
        let tokenPrincipal = types.principal(`${deployer.address}.wrapped-token`);

        let block1 = chain.mineBlock([
            Tx.contractCall('bridge', 'remove-token', [
                TOKEN_SOURCE,
                tokenPrincipal,
                types.principal(wallet_9.address)
            ], deployer.address),
        ]);
        assertEquals(block1.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);
    },
});
