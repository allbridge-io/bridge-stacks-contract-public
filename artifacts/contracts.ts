// Code generated with the stacksjs-helper-generator extension
// Manual edits will be overwritten

import { ClarityValue, BooleanCV, IntCV, UIntCV, BufferCV, OptionalCV, ResponseCV, PrincipalCV, ListCV, TupleCV, StringAsciiCV, StringUtf8CV, NoneCV } from "@stacks/transactions"

export namespace Sip010TraitFtStandardContract {
    export const address = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE";
    export const name = "sip-010-trait-ft-standard";

}

export namespace BridgeContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "bridge";

    // Functions
    export namespace Functions {
        // add-token
        export namespace AddToken {
            export const name = "add-token";

            export interface AddTokenArgs {
                tokenSource: BufferCV,
                token: ClarityValue,
                type: UIntCV,
                minFee: UIntCV,
            }

            export function args(args: AddTokenArgs): ClarityValue[] {
                return [
                    args.tokenSource,
                    args.token,
                    args.type,
                    args.minFee,
                ];
            }

        }

        // lock
        export namespace Lock {
            export const name = "lock";

            export interface LockArgs {
                lockId: BufferCV,
                traitAddress: ClarityValue,
                amount: UIntCV,
                recipient: BufferCV,
                destination: BufferCV,
            }

            export function args(args: LockArgs): ClarityValue[] {
                return [
                    args.lockId,
                    args.traitAddress,
                    args.amount,
                    args.recipient,
                    args.destination,
                ];
            }

        }

        // remove-token
        export namespace RemoveToken {
            export const name = "remove-token";

            export interface RemoveTokenArgs {
                tokenSource: BufferCV,
                token: ClarityValue,
                newOwner: PrincipalCV,
            }

            export function args(args: RemoveTokenArgs): ClarityValue[] {
                return [
                    args.tokenSource,
                    args.token,
                    args.newOwner,
                ];
            }

        }

        // set-base-fee-rate-bp
        export namespace SetBaseFeeRateBp {
            export const name = "set-base-fee-rate-bp";

            export interface SetBaseFeeRateBpArgs {
                value: UIntCV,
            }

            export function args(args: SetBaseFeeRateBpArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-fee-collector
        export namespace SetFeeCollector {
            export const name = "set-fee-collector";

            export interface SetFeeCollectorArgs {
                collector: PrincipalCV,
            }

            export function args(args: SetFeeCollectorArgs): ClarityValue[] {
                return [
                    args.collector,
                ];
            }

        }

        // set-is-bridge-enabled
        export namespace SetIsBridgeEnabled {
            export const name = "set-is-bridge-enabled";

            export interface SetIsBridgeEnabledArgs {
                enabled: BooleanCV,
            }

            export function args(args: SetIsBridgeEnabledArgs): ClarityValue[] {
                return [
                    args.enabled,
                ];
            }

        }

        // set-token-min-fee
        export namespace SetTokenMinFee {
            export const name = "set-token-min-fee";

            export interface SetTokenMinFeeArgs {
                nativeAddress: PrincipalCV,
                fee: UIntCV,
            }

            export function args(args: SetTokenMinFeeArgs): ClarityValue[] {
                return [
                    args.nativeAddress,
                    args.fee,
                ];
            }

        }

        // set-validator-public-key
        export namespace SetValidatorPublicKey {
            export const name = "set-validator-public-key";

            export interface SetValidatorPublicKeyArgs {
                publicKey: BufferCV,
            }

            export function args(args: SetValidatorPublicKeyArgs): ClarityValue[] {
                return [
                    args.publicKey,
                ];
            }

        }

        // unlock
        export namespace Unlock {
            export const name = "unlock";

            export interface UnlockArgs {
                lockId: BufferCV,
                recipient: BufferCV,
                systemAmount: UIntCV,
                lockSource: BufferCV,
                token: ClarityValue,
                signature: BufferCV,
            }

            export function args(args: UnlockArgs): ClarityValue[] {
                return [
                    args.lockId,
                    args.recipient,
                    args.systemAmount,
                    args.lockSource,
                    args.token,
                    args.signature,
                ];
            }

        }

        // from-system-precision
        export namespace FromSystemPrecision {
            export const name = "from-system-precision";

            export interface FromSystemPrecisionArgs {
                amount: UIntCV,
                precision: UIntCV,
            }

            export function args(args: FromSystemPrecisionArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.precision,
                ];
            }

        }

        // get-base-fee-rate-bp
        export namespace GetBaseFeeRateBp {
            export const name = "get-base-fee-rate-bp";

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-fee-collector
        export namespace GetFeeCollector {
            export const name = "get-fee-collector";

        }

        // get-is-bridge-enabled
        export namespace GetIsBridgeEnabled {
            export const name = "get-is-bridge-enabled";

        }

        // get-token-by-source
        export namespace GetTokenBySource {
            export const name = "get-token-by-source";

            export interface GetTokenBySourceArgs {
                tokenSource: BufferCV,
            }

            export function args(args: GetTokenBySourceArgs): ClarityValue[] {
                return [
                    args.tokenSource,
                ];
            }

        }

        // get-token-native
        export namespace GetTokenNative {
            export const name = "get-token-native";

            export interface GetTokenNativeArgs {
                nativeAddress: PrincipalCV,
            }

            export function args(args: GetTokenNativeArgs): ClarityValue[] {
                return [
                    args.nativeAddress,
                ];
            }

        }

        // get-validator-public-key
        export namespace GetValidatorPublicKey {
            export const name = "get-validator-public-key";

        }

        // to-system-precision
        export namespace ToSystemPrecision {
            export const name = "to-system-precision";

            export interface ToSystemPrecisionArgs {
                amount: UIntCV,
                precision: UIntCV,
            }

            export function args(args: ToSystemPrecisionArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.precision,
                ];
            }

        }

    }
}

export namespace IstxContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "istx";

    // Functions
    export namespace Functions {
        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace OwnableTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "ownable-trait";

}

export namespace BridgeTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "bridge-token-trait";

}

export namespace NativeTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "native-token";

    // Functions
    export namespace Functions {
        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-precision
        export namespace SetPrecision {
            export const name = "set-precision";

            export interface SetPrecisionArgs {
                value: UIntCV,
            }

            export function args(args: SetPrecisionArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace WrappedTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "wrapped-token";

    // Functions
    export namespace Functions {
        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}
