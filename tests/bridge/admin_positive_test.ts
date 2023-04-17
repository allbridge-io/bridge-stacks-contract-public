import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";

const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;
const TOKEN_SOURCE_ADDRESS_BUFFER = types.buff(Buffer.from(TOKEN_SOURCE.replace('0x', ''), 'hex'));


Clarinet.test({
    name: "authority check, positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let getContractOwnerBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-contract-owner', [], deployer.address);
        getContractOwnerBefore.result.expectOk().expectPrincipal(deployer.address);
        let getFeeCollectorBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-fee-collector', [], deployer.address);
        getFeeCollectorBefore.result.expectOk().expectPrincipal(deployer.address);
        let getValidatorPublicKeyBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-validator-public-key', [], deployer.address);
        getValidatorPublicKeyBefore.result.expectOk().expectBuff(Buffer.from('00', 'hex'));
        let getBaseFeeRateBPBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-base-fee-rate-bp', [], deployer.address);
        getBaseFeeRateBPBefore.result.expectOk().expectUint(10);
        // let getEnvVersionBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-env-version', [], deployer.address);
        // getEnvVersionBefore.result.expectOk().expectBuff(Buffer.from('1a', 'hex'));
        let getIsBridgeEnabledBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-is-bridge-enabled', [], deployer.address);
        getIsBridgeEnabledBefore.result.expectOk().expectBool(true);
        let block = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-contract-owner', [types.principal(wallet_2.address)], deployer.address),
            Tx.contractCall(`${deployer.address}.bridge`, 'set-fee-collector', [types.principal(wallet_2.address)], wallet_2.address),
            Tx.contractCall(`${deployer.address}.bridge`, 'set-validator-public-key', [types.buff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112233', 'hex'))], wallet_2.address),
            Tx.contractCall(`${deployer.address}.bridge`, 'set-is-bridge-enabled', [types.bool(false)], wallet_2.address),
            Tx.contractCall(`${deployer.address}.bridge`, 'set-base-fee-rate-bp', [types.uint(100)], wallet_2.address),
        ]);
        // 0: Bridge contract owner set
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Bridge fee collector set
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Bridge validator public key set
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Bridge enabled set
        block.receipts[3].result.expectOk().expectBool(true);

        let getContractOwnerAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-contract-owner', [], deployer.address);
        getContractOwnerAfter.result.expectOk().expectPrincipal(wallet_2.address);
        let getFeeCollectorAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-fee-collector', [], deployer.address);
        getFeeCollectorAfter.result.expectOk().expectPrincipal(wallet_2.address);
        let getValidatorPublicKeyAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-validator-public-key', [], deployer.address);
        getValidatorPublicKeyAfter.result.expectOk().expectBuff(Buffer.from('112233445566778899001122334455667788990011223344556677889900112233', 'hex'));
        let getBaseFeeRateBPAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-base-fee-rate-bp', [], deployer.address);
        getBaseFeeRateBPAfter.result.expectOk().expectUint(100);
        // let getEnvVersionAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-env-version', [], deployer.address);
        // getEnvVersionAfter.result.expectOk().expectBuff(Buffer.from('1a', 'hex'));
        let getIsBridgeEnabledAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'get-is-bridge-enabled', [], deployer.address);
        getIsBridgeEnabledAfter.result.expectOk().expectBool(false);
    },
});

Clarinet.test({
    name: "(set-fee) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let token_address = `${deployer.address}.wstx`
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let token_precision = types.uint(6);
        let min_fee = types.uint(100000);
        let min_fee_changed = types.uint(200000);

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'add-token ', [
                TOKEN_SOURCE_ADDRESS_BUFFER,
                token_principal,
                token_type,
                min_fee
            ], deployer.address),
            Tx.contractCall('bridge', 'get-token-by-source', [TOKEN_SOURCE_ADDRESS_BUFFER], deployer.address),
            Tx.contractCall('bridge', 'get-token-native', [token_principal], deployer.address),
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
            Tx.contractCall('bridge', 'set-token-min-fee', [token_principal, min_fee_changed], deployer.address)
        ]);
        block2.receipts[0].result.expectOk().expectBool(true);
        let block3 = chain.mineBlock([
            Tx.contractCall('bridge', 'get-token-native', [token_principal], deployer.address),
        ]);
        // 0: Successful query by native address
        assertEquals(
            block3.receipts[0].result.expectOk().expectTuple(),
            {
                'precision': token_precision,
                'token-source': TOKEN_SOURCE,
                'token-type': token_type,
                'min-fee': min_fee_changed,
            }
        );
    },
});


Clarinet.test({
    name: "Convert amount, positive",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'to-system-precision', [types.uint(15000), types.uint(6)], deployer.address),
            Tx.contractCall('bridge', 'to-system-precision', [types.uint(15000), types.uint(9)], deployer.address),
            Tx.contractCall('bridge', 'to-system-precision', [types.uint(15000), types.uint(12)], deployer.address),

            Tx.contractCall('bridge', 'from-system-precision', [types.uint(15000), types.uint(6)], deployer.address),
            Tx.contractCall('bridge', 'from-system-precision', [types.uint(15000), types.uint(9)], deployer.address),
            Tx.contractCall('bridge', 'from-system-precision', [types.uint(15000), types.uint(12)], deployer.address),
        ]);

        block.receipts[0].result.expectUint(15_000_000);
        block.receipts[1].result.expectUint(15_000);
        block.receipts[2].result.expectUint(15);

        block.receipts[3].result.expectUint(15);
        block.receipts[4].result.expectUint(15_000);
        block.receipts[5].result.expectUint(15_000_000);
    },
});