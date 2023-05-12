import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.5.0-rc.2/index.ts";
import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

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

const ERR_UNLOCK_EXISTS = 'u10008';
const ERR_WRONG_RECIPIENT = 'u10009';
const ERR_NOT_ALLOWED = 'u10002';
const ERR_BRIDGE_IS_DISABLED = 'u777';
const ERR_WRONG_LOCK_SOURCE = 'u10011';
const ERR_WRONG_SIGNATURE  = 'u10012';
const ERR_WRONG_VERSION = 'u10007';
const ERR_SAME_CHAIN = 'u20001';
const UNLOCK = '0x756e6c6f636b';

const bridge = EthAccount.create();
const privateBuff = new Buffer(bridge.privateKey.slice(2), "hex");
const ecKey = secp256k1.keyFromPrivate(privateBuff);
const publicKey = "0x" + ecKey.getPublic(true, "hex");

Clarinet.test({
    name: "(unlock) negative, second unlock with old lock id, base token (STX)",
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
        //signedBuff[signedBuff.length-1] = 1 //recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
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

        let blockSecondUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockSecondUnlock.receipts[0].result.expectErr(), ERR_UNLOCK_EXISTS);

        let assetsAfterSecond = chain.getAssetsMaps();
        assertEquals(assetsAfterSecond['assets']["STX"][wallet_2.address], (100100000000000));

    },
});

Clarinet.test({
    name: "(unlock-base) negative, wrong account for signature, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let token_address = `${deployer.address}.istx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        const anotherAccount = EthAccount.create();
        assertNotEquals(bridge, anotherAccount);

        const anotherBuffer = new Buffer(anotherAccount.privateKey.slice(2), "hex");
        assertNotEquals(privateBuff, anotherBuffer);

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
        
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        const signedAnother = EthAccount.sign(Hash.keccak256(message), anotherAccount.privateKey.toString('hex'));
        assertNotEquals(signed, signedAnother);
        let expectedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        expectedBuff = Buffer.concat([expectedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value

        let signedBuff = Buffer.from(signedAnother.replace('0x', ''), 'hex');
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_SIGNATURE);
        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, wrong message, base token (STX)",
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

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd55' //  wrong address
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
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        
        const recipient_2 = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd23' //  ::encode 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_SIGNATURE);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, wrong amount, base token (STX)",
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
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u10000000000000000', //10 000 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_SIGNATURE);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, unlock after bridge shutdown, base token (STX)",
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

        let blockUnlock = chain.mineBlock([
            Tx.contractCall(`${deployer.address}.bridge`, 'set-is-bridge-enabled', [types.bool(false)], deployer.address),
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);

        blockUnlock.receipts[0].result.expectOk().expectBool(true);
        assertEquals(blockUnlock.receipts[1].result.expectErr(), ERR_BRIDGE_IS_DISABLED);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, wrong lock id version, base token (STX)",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        let deployer = accounts.get('deployer')!;
        let wallet_2 = accounts.get('wallet_2')!;

        let token_address = `${deployer.address}.istx`;
        let token_principal = types.principal(token_address);
        let token_type = types.uint(100);
        let fee_number = 1000;
        let min_fee = types.uint(fee_number);

        const wrong_lock_id = '0x07000000000000000000000000000000';

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
            Buffer.from(wrong_lock_id.replace('0x', ''), "hex"),
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
            wrong_lock_id,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            LOCK_SOURCE,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_VERSION);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, unlock from the same chain, base token (STX)",
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
        const uintLockAmount = "0x01000000000000000000005af3107a4000"
        const sameChain = '0x53544B53';

        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(sameChain.replace('0x', ''), "hex"),
            Buffer.from(TOKEN_SOURCE.replace('0x', ''), "hex"),
            Buffer.from(UNLOCK.replace('0x', ''), "hex")
        ]);
        const signed = EthAccount.sign(Hash.keccak256(message), bridge.privateKey.toString('hex'));
        let signedBuff = Buffer.from(signed.replace('0x', ''), 'hex');
        //signedBuff[signedBuff.length-1] -= 27 // recovery value
        signedBuff = Buffer.concat([signedBuff.slice(0, -1), Buffer.from('01', 'hex')]); // recovery value
        let unlock_params = [
            LOCK_ID,
            types.principal(wallet_2.address),
            'u100000000000000', //100 Grands in system precision
            sameChain,
            token_principal,
            `0x${signedBuff.toString('hex')}`
        ];
        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);

        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_SAME_CHAIN);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});

Clarinet.test({
    name: "(unlock-base) negative, short recipient address, base token (STX)",
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

        const recipient = '0x99e2ec69ac5b6e67b4e26edd0e2c1c1a6b9bbd' //  recipient address length 31 bytes
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
            types.buff(Buffer.from(LOCK_ID.replace('0x', ''), "hex")),
            types.principal('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'),
            types.uint(100000000000000), //100 Grands in system precision
            types.buff(Buffer.from(LOCK_SOURCE.replace('0x', ''), "hex")),
            token_principal,
            types.buff(signedBuff),
        ];

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_RECIPIENT);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});


Clarinet.test({
    name: "(unlock-base) negative, short source chain id, base token (STX)",
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
        const wrong_source_id = '0x334455';   // short source chain id
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(wrong_source_id.replace('0x', ''), "hex"),
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
            wrong_source_id,
            token_principal,
            types.buff(signedBuff),
        ];

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts[0].result.expectErr(), ERR_WRONG_LOCK_SOURCE);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});


Clarinet.test({
    name: "(unlock-base) negative, long source chain id, base token (STX)",
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
        const wrong_source_id = '0x3344550075';   // short source chain id
        const message = Buffer.concat([
            Buffer.from(LOCK_ID.replace('0x', ''), "hex"),
            Buffer.from(recipient.replace('0x', ''), "hex"),
            Buffer.from(uintLockAmount.replace('0x', ''), "hex"),
            Buffer.from(wrong_source_id.replace('0x', ''), "hex"),
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
            wrong_source_id,
            token_principal,
            types.buff(signedBuff),
        ];

        let blockUnlock = chain.mineBlock([
            Tx.contractCall('bridge', 'unlock', unlock_params, wallet_2.address),
        ]);
        assertEquals(blockUnlock.receipts, []);

        let assetsAfter = chain.getAssetsMaps();
        assertEquals(assetsAfter['assets']["STX"][wallet_2.address], (100000000000000));
    },
});