import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;

const ERR_NOT_ALLOWED = 'u10002';


Clarinet.test({
    name: "(set-contract-owner) negative, wrong authority",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let getContractOwnerBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-contract-owner', [], wallet_1.address);
        getContractOwnerBefore.result.expectOk().expectPrincipal(deployer.address);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-contract-owner', [types.principal(wallet_1.address)], wallet_1.address),
        ]);

        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let getContractOwnerAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-contract-owner', [], wallet_1.address);
        getContractOwnerAfter.result.expectOk().expectPrincipal(deployer.address);
    },
});

Clarinet.test({
    name: "(set-fee-collector) negative, wrong authority",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let getFeeCollectorBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-fee-collector', [], wallet_1.address);
        getFeeCollectorBefore.result.expectOk().expectPrincipal(deployer.address);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-fee-collector', [types.principal(wallet_1.address)], wallet_1.address),
        ]);

        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let getFeeCollectorAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-fee-collector', [], wallet_1.address);
        getFeeCollectorAfter.result.expectOk().expectPrincipal(deployer.address);
    },
});

Clarinet.test({
    name: "(set-validator-public-key) negative, wrong authority",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let getValidatorPublicKeyBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-validator-public-key', [], wallet_1.address);
        getValidatorPublicKeyBefore.result.expectOk().expectBuff(Buffer.from('00', 'hex'));

        let blockSuccess = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-validator-public-key', [types.buff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112233', 'hex'))], deployer.address),
        ]);

        blockSuccess.receipts[0].result.expectOk().expectBool(true);

        let getValidatorPublicKeyAfterSuccess = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-validator-public-key', [], wallet_1.address);
        getValidatorPublicKeyAfterSuccess.result.expectOk().expectBuff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112233', 'hex'));

        let blockErr = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-validator-public-key', [types.buff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112255', 'hex'))], wallet_1.address),
        ]);

        assertEquals(blockErr.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let getValidatorPublicKeyAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-validator-public-key', [], wallet_1.address);
        getValidatorPublicKeyAfter.result.expectOk().expectBuff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112233', 'hex'));
    },
});

Clarinet.test({
    name: "(set-is-bridge-enabled) negative, wrong authority",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let getIsBridgeEnabledBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-is-bridge-enabled', [], wallet_1.address);
        getIsBridgeEnabledBefore.result.expectOk().expectBool(true);
  
        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-is-bridge-enabled', [types.bool(false)], wallet_1.address),
        ]);

        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let getIsBridgeEnabledAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-is-bridge-enabled', [], wallet_1.address);
        getIsBridgeEnabledAfter.result.expectOk().expectBool(true);
    },
});

Clarinet.test({
    name: "(set-base-fee-rate-bp) negative, wrong authority",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let getBaseFeeRateBPBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-base-fee-rate-bp', [], wallet_1.address);
        getBaseFeeRateBPBefore.result.expectOk().expectUint(10);

        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-base-fee-rate-bp', [types.uint(100)], wallet_1.address),
        ]);

        assertEquals(block.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);

        let getBaseFeeRateBPAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-base-fee-rate-bp', [], wallet_1.address);
        getBaseFeeRateBPAfter.result.expectOk().expectUint(10);
    },
});

Clarinet.test({
    name: "(set-fee) negative, wrong authority, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;

        let token_address = `${deployer.address}.wstx`
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let token_precision = types.uint(6);
        let min_fee = types.uint(100000);
        let min_fee_changed = types.uint(200000);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE,
                token_principal,
                token_type,
                min_fee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE], wallet_1.address),
            Tx.contractCall('bridge', 'get-token-native', [token_principal], wallet_1.address),
        ]);
        // 0: Token added
        assertEquals(block.receipts[0].result.expectOk(), 'true');
        // 1: Successful query by source
        assertEquals(
            block.receipts[1].result.expectOk().expectTuple(),
            {address: token_address}
        );
        // 2: Successful query by native address
        assertEquals(
            block.receipts[2].result.expectOk().expectTuple(),
            {
                'precision': token_precision,
                'token-source': TOKEN_SOURCE,
                'token-type': token_type,
                'min-fee': min_fee,
            }
        );

        let block2 = chain.mineBlock([
            Tx.contractCall('bridge', 'set-token-min-fee', [token_principal, min_fee_changed], wallet_1.address)
        ]);
        // Error when changing the commission by a non-owner
        assertEquals(block2.receipts[0].result.expectErr(), ERR_NOT_ALLOWED);
        
        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-native', [token_principal], wallet_1.address),
        ]);
        // Successful query by native address
        assertEquals(
            block3.receipts[0].result.expectOk().expectTuple(),
            {
                'precision': token_precision,
                'token-source': TOKEN_SOURCE,
                'token-type': token_type,
                'min-fee': min_fee,
            }
        );
    },
});