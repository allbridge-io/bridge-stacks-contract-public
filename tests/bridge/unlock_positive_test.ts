import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

import {
    Account as EthAccount,
    Hash,
} from "https://deno.land/x/npm_eth_lib@0.1.29/mod.js";
import { Buffer } from "https://cdn.skypack.dev/buffer@5.6.0";
import elliptic from "https://cdn.skypack.dev/elliptic@6.5.3";
const secp256k1 = new (elliptic.ec)("secp256k1");

const CHAIN_OTHER = '0x11223344';
const TOKEN_SOURCE_ADDRESS = '0x0000000000000000000000006d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce';
const TOKEN_SOURCE = `0x${CHAIN_OTHER.replace('0x', '')}${TOKEN_SOURCE_ADDRESS.replace('0x', '')}`;

const LOCK_ID = '0x01000000000000000000000000000000';
const LOCK_SOURCE = '0x33445500';
const UNLOCK = '0x756e6c6f636b';

const bridge = EthAccount.create();
const privateBuff = new Buffer(bridge.privateKey.slice(2), "hex");
const ecKey = secp256k1.keyFromPrivate(privateBuff);
const publicKey = "0x" + ecKey.getPublic(true, "hex");

const ERR_UNLOCK_EXISTS = 10008;
const ERR_WRONG_UNLOCK_ID = 20004;
//console.log(secp256k1.keyFromPrivate(new Buffer('d1e8d1a24bf1bffacb4cfbc3db1ea9fdae528ef3214c4726465b02ebcdb2d2f4', 'hex')).getPublic(true, "hex"));
Clarinet.test({
    name: "(unlock) positive, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let token_address = `${deployer.address}.istx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');
        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
            Tx.transferSTX(10_000_000_000_000, `${deployer.address}.bridge`, deployer.address),
        ]);
        // 0: Set validator public key
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Transfer STX
        block.receipts[2].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000" // ::encode u100000000000000
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signedBuff[signedBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            types.buff(signedBuff),
        ];

        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        // console.log(blockUnlock.receipts);
        // console.log(blockUnlock.receipts[0].events[0]);
        // console.log(blockUnlock.receipts[0].events[1]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true)
        blockUnlock.receipts[0].events.expectSTXTransferEvent(
            100_000_000_000,
            `${deployer.address}.bridge`,
            wallet_2.address,
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100100000000000));
        assertEquals(assetsAfter['assets']["STX"][`${deployer.address}.bridge`], (9900000000000));

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        //console.log(isClaimedAfter.result)
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);
    },
});
Clarinet.test({
    name: "(unlock) simulate, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        return;

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let token_address = `${deployer.address}.wrapped-token`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let setOwnerBlock = chain.mineBlock([
            //Tx.contractCall('wrapped-token', 'transfer', [types.uint(1000000000000000), types.principal(deployer.address), types.principal(`${deployer.address}.bridge`), types.none()], deployer.address),
            Tx.contractCall('wrapped-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');
        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'set-validator-public-key', ['0x02614bbb47c43916c5611e1a5bd519c34ebf3427ed6308bc1ea2b194ca2c36077a'], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [
                '0x53544B5300000000000000006a746f6e4200bbfdeade602412e2ff8b449504f3fb81c1c9', 
                token_principal, 
                token_type, 
                min_fee
            ], deployer.address),
            Tx.transferSTX(10_000_000_000_000, `${deployer.address}.bridge`, deployer.address),
        ]);
        // 0: Set validator public key
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Transfer STX
        block.receipts[2].result.expectOk().expectBool(true);

        const recipient = '0x565c4ac794d995fd0d0faa6ee8d9cffcdcd0d8ef' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000002d79883d2000" // ::encode u100000000000000
        const message = Buffer.concat([
            Buffer.from('01000000000000000000000000000003', "hex"),
            Buffer.from('250a71418150c728a77c688507b91a35669295e4', "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from('03545241', "hex"),
            Buffer.from('53544B5300000000000000006a746f6e4200bbfdeade602412e2ff8b449504f3fb81c1c9', "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), '0xd1e8d1a24bf1bffacb4cfbc3db1ea9fdae528ef3214c4726465b02ebcdb2d2f4');
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signedBuff[signedBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        //console.log(signedBuff.toString('hex'));
        let unlock_params = [
            '0x01000000000000000000000000000000',
            types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
            'u50000000000000', //100 Grands in system precision
            '0x03545241',
            token_principal,
            types.buff(signedBuff),
        ];

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true)
        blockUnlock.receipts[0].events.expectSTXTransferEvent(
            100_000_000_000,
            `${deployer.address}.bridge`,
            wallet_2.address,
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100100000000000));
    },
});

Clarinet.test({
    name: "(unlock) positive, wrapped token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.wrapped-token`);
        let token_type = types.uint(300);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('wrapped-token', 'transfer', [types.uint(1000000000000000000), types.principal(deployer.address), types.principal(wallet_2.address), types.none()], deployer.address),
            Tx.contractCall('wrapped-token', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: change owner
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Set validator public key
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Token added
        block.receipts[3].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signedBuff[signedBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];

        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true)
        blockUnlock.receipts[0].events.expectFungibleTokenMintEvent(
            "10000000000000",
            wallet_2.address,
            `${deployer.address}.wrapped-token::wrapped-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".wrapped-token.wrapped-token"][wallet_2.address], 1000010000000000000);

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);
    },
});

Clarinet.test({
    name: "(unlock) positive, native token (SIP-010)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);
        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'mint', [`${types.principal(deployer.address)}.bridge`, types.uint(1000000000000000000), types.none()], deployer.address),
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        // 0: Mint wrapped token
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Set validator public key
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Token added
        block.receipts[2].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signatureBuff[signatureBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        
        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true)
        blockUnlock.receipts[0].events.expectFungibleTokenTransferEvent(
            "100000000000000",
            `${deployer.address}.bridge`,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], 100000000000000);

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);
    },
});


Clarinet.test({
    name: "(unlock) positive, native token (SIP-010), precision 6",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);
        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'set-precision', [types.uint(6)], deployer.address),
            Tx.contractCall('native-token', 'mint', [types.principal(`${deployer.address}.bridge`), types.uint(1000000000000000000), types.none()], deployer.address),
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        // 0: change precision
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Mint wrapped token
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Set validator public key
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Token added
        block.receipts[3].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signatureBuff[signatureBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        
        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true);
        blockUnlock.receipts[0].events.expectFungibleTokenTransferEvent(
            "100000000000",
            `${deployer.address}.bridge`,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], 100000000000);

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);
    },
});


Clarinet.test({
    name: "(unlock) positive, native token (SIP-010), precision 12",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_principal = types.principal(`${deployer.address}.native-token`);
        let token_type = types.uint(200);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let block = chain.mineBlock([
            Tx.contractCall('native-token', 'set-precision', [types.uint(12)], deployer.address),
            Tx.contractCall('native-token', 'mint', [types.principal(`${deployer.address}.bridge`), types.uint(1000000000000000000), types.none()], deployer.address),
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
        ]);
        // 0: change precision
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Mint wrapped token
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Set validator public key
        block.receipts[2].result.expectOk().expectBool(true);
        // 3: Token added
        block.receipts[3].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signatureBuff[signatureBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        
        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true);
        blockUnlock.receipts[0].events.expectFungibleTokenTransferEvent(
            "100000000000000000",
            `${deployer.address}.bridge`,
            wallet_2.address,
            `${deployer.address}.native-token::native-token`
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets'][".native-token.native-token"][wallet_2.address], 100000000000000000);

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);
    },
});

Clarinet.test({
    name: "(unlock) positive, possible only once, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_1 = accounts.get('wallet_1')!;
        let wallet_2 = accounts.get('wallet_2')!;
        let token_address = `${deployer.address}.istx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        let setOwnerBlock = chain.mineBlock([
            Tx.contractCall('istx', 'set-contract-owner', [types.principal(`${deployer.address}.bridge`)], deployer.address),
        ]);
        // 0: Transfer Ownership to bridge
        assertEquals(setOwnerBlock.receipts[0].result.expectOk(), 'true');

        let block = chain.mineBlock([
            Tx.contractCall('bridge', 'set-validator-public-key', [publicKey], deployer.address),
            Tx.contractCall('bridge', 'add-token ', [TOKEN_SOURCE, token_principal, token_type, min_fee], deployer.address),
            Tx.transferSTX(10_000_000_000_000, `${deployer.address}.bridge`, deployer.address),
        ]);
        // 0: Set validator public key
        block.receipts[0].result.expectOk().expectBool(true);
        // 1: Token added
        block.receipts[1].result.expectOk().expectBool(true);
        // 2: Transfer STX
        block.receipts[2].result.expectOk().expectBool(true);

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), `0x${privateBuff.toString('hex')}`);
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signatureBuff[signatureBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value

        let unlock_params = [
            LOCK_ID,
            types.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];

        let isClaimedBefore = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [LOCK_ID], deployer.address);
        isClaimedBefore.result.expectErr().expectUint(ERR_WRONG_UNLOCK_ID);

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        blockUnlock.receipts[0].result.expectOk().expectBool(true)
        blockUnlock.receipts[0].events.expectSTXTransferEvent(
            100_000_000_000,
            `${deployer.address}.bridge`,
            wallet_2.address,
        );
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_1.address], (100000000000000));
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100100000000000));

        let isClaimedAfter = chain.callReadOnlyFn(`${deployer.address}.bridge`, 'is-claimed', [
            types.buff(Buffer.from(`${LOCK_SOURCE.replace('0x', '')}${LOCK_ID.replace('0x', '')}`, 'hex'))
        ], deployer.address);
        isClaimedAfter.result.expectOk().expectTuple()['value'].expectBool(true);

        // try to unlock again
        let blockUnlock2 = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_1.address),
        ]);
        blockUnlock2.receipts[0].result.expectErr().expectUint(ERR_UNLOCK_EXISTS);
        blockUnlock2.receipts[0].result.expectErr().expectUint(ERR_UNLOCK_EXISTS);
        let assetsAfterAgain = chain.getAssetsMaps();
        assertEquals(assetsAfterAgain['assets']["STX"][wallet_1.address], (100000000000000));
        assertEquals(assetsAfterAgain['assets']["STX"][wallet_2.address], (100100000000000));
    }
});