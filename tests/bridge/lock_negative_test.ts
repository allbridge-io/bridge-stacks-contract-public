import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";


const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;

const ERR_TOKEN_DOES_NOT_EXIST = 'u10001';
const ERR_AMOUNT_IS_TOO_SMALL = 'u10004';
const ERR_INSUFFICIENT_FUNDS = 'u1';
const ERR_BRIDGE_ZERO_AMOUNT = 'u10003';
const ERR_WRONG_RECIPIENT = 'u10009';
const ERR_WRONG_DESTINATION = 'u10010';
const ERR_WRONG_VERSION = 'u10007';
const ERR_LOCK_ID_EXISTS = 'u10006';
const ERR_BRIDGE_IS_DISABLED = 'u777';
const ERR_SAME_CHAIN = 'u20001';

const LOCK_ID = '0x01000000000000000000000000000000';
const LOCK_DESTINATION = '0x11223344';
const LOCK_RECIPIENT = '0x1122334455667788990011223344556677889900112233445566778899001122';
const LOCK_AMOUNT: number = 100_000_000_000; // 100 000 STX

Clarinet.test({
    name: "(lock) negative, token does not exist, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);

        let params = [
            LOCK_ID,
            token_principal,
            types.uint(LOCK_AMOUNT),
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        let sender = accounts.get('wallet_2')!;
        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);

        assertEquals(block.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});

Clarinet.test({
    name: "(lock) negative, token does not exist, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);

        let fee_number = 1000;
        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            //Tx.contractCall('native-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
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
        //block.receipts[1].result.expectOk().expectBool(true);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".native-token.native-token"][wallet_2.address], (10000000000000000000));
        
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], (10000000000000000000));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][deployer.address], (undefined));
    },
});

Clarinet.test({
    name: "(lock) negative, token does not exist, wrapped token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.wrapped-token`);

        //1 wTOKEN = 1_000_000_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-token', 'transfer', ['u10000000000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('wrapped-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
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

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".wrapped-token.wrapped-token"][wallet_2.address], (10000000000000000000));
        
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_TOKEN_DOES_NOT_EXIST);
        
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".wrapped-token.wrapped-token"][wallet_2.address], (10000000000000000000));
        assertEquals(assetsAfter['assets'][".wrapped-token.wrapped-token"][deployer.address], (undefined));
    },
});

Clarinet.test({
    name: "(lock) negative, bridging more amount than there is on the bridge, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);

        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        //1 wTOKEN = 1_000_000_000_000 uwTOKEN
        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'transfer', ['u10000000000000', types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('bridge', 'set-fee-collector', [types.principal(wallet_1.address)], deployer.address),
            Tx.contractCall('bridge', 'add-token', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            'u10000000000001',
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];
        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Fee Collector set
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);

        let assetsBefore = chain.getAssetsMaps();
        assertEquals(assetsBefore['assets'][".native-token.native-token"][wallet_2.address], (10000000000000));
        
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, wallet_2.address)
        ]);
        assertEquals(block_1.receipts[0].result.expectErr(), ERR_INSUFFICIENT_FUNDS);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], (10000000000000));
        assertEquals(assetsAfter['assets'][".native-token.native-token"][deployer.address], undefined);
    },
});

Clarinet.test({
    name: "(lock) negative, bridging zero, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            types.uint(0),
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);

        let sender = accounts.get('wallet_2')!;
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);
        
        assertEquals(block_1.receipts[0].result.expectErr(), ERR_BRIDGE_ZERO_AMOUNT);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});

Clarinet.test({
    name: "(lock) negative, lock using old lock-id, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let sender = accounts.get('wallet_2')!;
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
        // 0: Approve bridge contract
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Approve fee collector contract
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Fee Collector set
        block.receipts[3].result.expectOk().expectBool(true);

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

        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);

        let block_3 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);

        assertEquals(block_3.receipts[0].result.expectErr(), ERR_LOCK_ID_EXISTS);

        let block_4 = chain.mineBlock([]);
        assertEquals(block_4.receipts.length, 0);

        let assetsAfterWrong = chain.getAssetsMaps();
        assertEquals(assetsAfterWrong['assets']['STX'][sender.address], 99900000000000);
        assertEquals(assetsAfterWrong['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfterWrong['assets']['STX'][wallet_1.address], 100000100000000);
        assertEquals(assetsAfterWrong['assets']['STX'][`${deployer.address}.bridge`], 99900000000);

    },
});

Clarinet.test({
    name: "(lock-base) negative, lock after bridge shutdown, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            LOCK_ID,
            token_principal,
            types.uint(LOCK_AMOUNT),
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);

        let sender = accounts.get('wallet_2')!;
        let block_1 = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-is-bridge-enabled', [types.bool(false)], deployer.address),
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);

        block_1.receipts[0].result.expectOk().expectBool(true);
        assertEquals(block_1.receipts[1].result.expectErr(), ERR_BRIDGE_IS_DISABLED);
        
        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});

Clarinet.test({
    name: "(lock-base) negative, wrong lock id, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);
        const wrong_lock_id = '0x07000000000000000000000000000000';

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        let params = [
            wrong_lock_id,
            token_principal,
            types.uint(LOCK_AMOUNT),
            LOCK_RECIPIENT,
            LOCK_DESTINATION,
        ];

        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);

        let sender = accounts.get('wallet_2')!;
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_WRONG_VERSION);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});

Clarinet.test({
    name: "(lock-base) negative, lock to same chain, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);

        // 0: Token added
        block.receipts[0].result.expectOk().expectBool(true);

        const sameChain = '0x53544B53';
        let params = [
            LOCK_ID,
            token_principal,
            types.uint(LOCK_AMOUNT),
            LOCK_RECIPIENT,
            sameChain,
        ];

        let sender = accounts.get('wallet_2')!;
        let block_1 = chain.mineBlock([
            Tx.contractCall('bridge', 'lock', params, sender.address)
        ]);

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_SAME_CHAIN);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});

Clarinet.test({
    name: "(lock-base) negative, amount equals the minimum fee, base token (STX)",
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
            types.uint(1000),
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

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_AMOUNT_IS_TOO_SMALL);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});


Clarinet.test({
    name: "(lock-base) negative, amount greater than zero but less than the minimum fee, base token (STX)",
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
            types.uint(100),
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

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_AMOUNT_IS_TOO_SMALL);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});


Clarinet.test({
    name: "(lock-base) negative, short recipient address, base token (STX)",
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
            types.uint(100),
            '0x11223344556677889900112233445566778899001122334455667788990011', // recipient address length 31 bytes
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

        assertEquals(block_1.receipts[0].result.expectErr(), ERR_WRONG_RECIPIENT);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});


Clarinet.test({
    name: "(lock-base) negative, long recipient address, base token (STX)",
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
            types.uint(100),
            '0x112233445566778899001122334455667788990011223344556677889900112255', // recipient address length 33 bytes
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

        assertEquals(block_1.receipts.length, 0);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});


Clarinet.test({
    name: "(lock-base) negative, long destination chain id, base token (STX)",
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
            '0x1122334465',     // long destination chain ID
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
        assertEquals(block_1.receipts.length, 0);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});


Clarinet.test({
    name: "(lock-base) negative, short destination chain id, base token (STX)",
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
            '0x112233',     // short destination chain ID
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
        assertEquals(block_1.receipts[0].result.expectErr(), ERR_WRONG_DESTINATION);

        chain.mineEmptyBlockUntil(10);
        let block_2 = chain.mineBlock([]);
        assertEquals(block_2.receipts.length, 0);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']['STX'][sender.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][deployer.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][wallet_1.address], 100000000000000);
        assertEquals(assetsAfter['assets']['STX'][`${deployer.address}.bridge`], undefined);
    },
});
