import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;

const LOCK_ID = '0x01000000000000000000000000000000';
const LOCK_DESTINATION = '0x11223344';
const LOCK_RECIPIENT = '0x1122334455667788990011223344556677889900112233445566778899001122';
const LOCK_AMOUNT: number = 100_000_000_000; // 100 000 STX

Clarinet.test({
    name: "(lock-base) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('wstx', 'approve-contract', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('wstx', 'approve-contract', [types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
            Tx.contractCall('bridge', 'set-fee-collector', [types.principal(wallet_1.address)], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            types.uint(LOCK_AMOUNT),
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Approve contract
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Approve fee collector
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Fee collector set
        block.receipts[3].result.expectOk().expectBool(true);

        let sender = accounts.get('wallet_2')!;
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);
        block_1.receipts[0].result.expectOk().expectBool(true);
        assertEquals(block_1.receipts[0].events.length, 2);        
        block_1.receipts[0].events.expectSTXTransferEvent(
            "99900000000",
            sender.address,
            `${deployer.address}.bridge`
        );
        block_1.receipts[0].events.expectSTXTransferEvent(
            "100000000",
            sender.address,
            wallet_1.address
        );
        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 99900000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000100000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], 99900000000);
    },
});

Clarinet.test({
    name: "(lock) positive, wrapped token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.wrapped-token`);

        let token_type = types.uint(300);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('wrapped-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            'u10000000000000000000',
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: change owner
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);
        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".wrapped-token.wrapped-token"][wallet_2.address], (10000000000000000000));
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);
        block_1.receipts[0].result.expectOk().expectBool(true);
        block_1.receipts[0].events.expectFungibleTokenTransferEvent(
            10000000000000000,
            wallet_2.address,
            deployer.address,
            `${deployer.address}.wrapped-token::wrapped-token`
        );
        block_1.receipts[0].events.expectFungibleTokenBurnEvent(
            9990000000000000000,
            wallet_2.address,
            `${deployer.address}.wrapped-token::wrapped-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".wrapped-token.wrapped-token"][wallet_2.address], (0));
        assertEquals(assetsAfter['assets'][".wrapped-token.wrapped-token"][deployer.address], (10000000000000000));
    },
});

Clarinet.test({
    name: "(lock) positive, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);

        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('native-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            'u10000000000000000000',
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: change owner
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);
        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".native-token.native-token"][wallet_2.address], (10000000000000000000));
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);
        block_1.receipts[0].result.expectOk().expectBool(true);
        block_1.receipts[0].events.expectFungibleTokenTransferEvent(
            10000000000000000,
            wallet_2.address,
            deployer.address,
            `${deployer.address}.native-token::native-token`
        );
        block_1.receipts[0].events.expectFungibleTokenBurnEvent(
            9990000000000000000,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], (0));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][deployer.address], (10000000000000000));
    },
});


Clarinet.test({
    name: "(lock) positive, native token (SIP-010) precision 6",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);

        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('native-token', 'set-precision', ['u6'], deployer.address),
            Tx.contractCall('native-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            'u10000000000000000000',
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: change precision
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: change owner
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Token added
        block.receipts[3].result.expectOk().expectBool(true);
        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".native-token.native-token"][wallet_2.address], (10000000000000000000));
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);
        block_1.receipts[0].result.expectOk().expectBool(true);
        block_1.receipts[0].events.expectFungibleTokenTransferEvent(
            10000000000000000,
            wallet_2.address,
            deployer.address,
            `${deployer.address}.native-token::native-token`
        );
        block_1.receipts[0].events.expectFungibleTokenBurnEvent(
            9990000000000000000,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], (0));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][deployer.address], (10000000000000000));
    },
});

Clarinet.test({
    name: "(lock) positive, native token (SIP-010) precision 12",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);

        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('native-token', 'set-precision', ['u12'], deployer.address),
            Tx.contractCall('native-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            'u10000000000000000000',
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: change precision
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: change owner
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Token added
        block.receipts[3].result.expectOk().expectBool(true);
        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".native-token.native-token"][wallet_2.address], (10000000000000000000));
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);
        block_1.receipts[0].result.expectOk().expectBool(true);
        block_1.receipts[0].events.expectFungibleTokenTransferEvent(
            10000000000000000,
            wallet_2.address,
            deployer.address,
            `${deployer.address}.native-token::native-token`
        );
        block_1.receipts[0].events.expectFungibleTokenBurnEvent(
            9990000000000000000,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], (0));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][deployer.address], (10000000000000000));
    },
});