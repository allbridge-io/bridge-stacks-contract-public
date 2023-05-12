import { ClarityValue, BooleanCV, UIntCV, BufferCV, PrincipalCV, StringUtf8CV, NoneCV } from "@stacks/transactions";
export declare namespace WrappedTokenContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "wrapped-token";
    namespace Functions {
        namespace SetContractOwner {
            const name = "set-contract-owner";
            interface SetContractOwnerArgs {
                owner: PrincipalCV;
            }
            function args(args: SetContractOwnerArgs): ClarityValue[];
        }
        namespace SetTokenUri {
            const name = "set-token-uri";
            interface SetTokenUriArgs {
                value: StringUtf8CV;
            }
            function args(args: SetTokenUriArgs): ClarityValue[];
        }
        namespace Transfer {
            const name = "transfer";
            interface TransferArgs {
                amount: UIntCV;
                sender: PrincipalCV;
                recipient: PrincipalCV;
                memo: NoneCV;
            }
            function args(args: TransferArgs): ClarityValue[];
        }
        namespace GetBalance {
            const name = "get-balance";
            interface GetBalanceArgs {
                account: PrincipalCV;
            }
            function args(args: GetBalanceArgs): ClarityValue[];
        }
        namespace GetContractOwner {
            const name = "get-contract-owner";
        }
        namespace GetDecimals {
            const name = "get-decimals";
        }
        namespace GetName {
            const name = "get-name";
        }
        namespace GetSymbol {
            const name = "get-symbol";
        }
        namespace GetTokenUri {
            const name = "get-token-uri";
        }
        namespace GetTotalSupply {
            const name = "get-total-supply";
        }
    }
}
export declare namespace WstxContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "wstx";
    namespace Functions {
        namespace ApproveContract {
            const name = "approve-contract";
            interface ApproveContractArgs {
                contract: PrincipalCV;
            }
            function args(args: ApproveContractArgs): ClarityValue[];
        }
        namespace DisapproveContract {
            const name = "disapprove-contract";
            interface DisapproveContractArgs {
                contract: PrincipalCV;
            }
            function args(args: DisapproveContractArgs): ClarityValue[];
        }
        namespace SetContractOwner {
            const name = "set-contract-owner";
            interface SetContractOwnerArgs {
                owner: PrincipalCV;
            }
            function args(args: SetContractOwnerArgs): ClarityValue[];
        }
        namespace SetTokenUri {
            const name = "set-token-uri";
            interface SetTokenUriArgs {
                value: StringUtf8CV;
            }
            function args(args: SetTokenUriArgs): ClarityValue[];
        }
        namespace Transfer {
            const name = "transfer";
            interface TransferArgs {
                amount: UIntCV;
                sender: PrincipalCV;
                recipient: PrincipalCV;
                memo: NoneCV;
            }
            function args(args: TransferArgs): ClarityValue[];
        }
        namespace GetBalance {
            const name = "get-balance";
            interface GetBalanceArgs {
                account: PrincipalCV;
            }
            function args(args: GetBalanceArgs): ClarityValue[];
        }
        namespace GetContractOwner {
            const name = "get-contract-owner";
        }
        namespace GetDecimals {
            const name = "get-decimals";
        }
        namespace GetName {
            const name = "get-name";
        }
        namespace GetSymbol {
            const name = "get-symbol";
        }
        namespace GetTokenUri {
            const name = "get-token-uri";
        }
        namespace GetTotalSupply {
            const name = "get-total-supply";
        }
    }
}
export declare namespace BridgeTokenTraitContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "bridge-token-trait";
}
export declare namespace NativeTokenContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "native-token";
    namespace Functions {
        namespace SetContractOwner {
            const name = "set-contract-owner";
            interface SetContractOwnerArgs {
                owner: PrincipalCV;
            }
            function args(args: SetContractOwnerArgs): ClarityValue[];
        }
        namespace SetPrecision {
            const name = "set-precision";
            interface SetPrecisionArgs {
                value: UIntCV;
            }
            function args(args: SetPrecisionArgs): ClarityValue[];
        }
        namespace SetTokenUri {
            const name = "set-token-uri";
            interface SetTokenUriArgs {
                value: StringUtf8CV;
            }
            function args(args: SetTokenUriArgs): ClarityValue[];
        }
        namespace Transfer {
            const name = "transfer";
            interface TransferArgs {
                amount: UIntCV;
                sender: PrincipalCV;
                recipient: PrincipalCV;
                memo: NoneCV;
            }
            function args(args: TransferArgs): ClarityValue[];
        }
        namespace GetBalance {
            const name = "get-balance";
            interface GetBalanceArgs {
                account: PrincipalCV;
            }
            function args(args: GetBalanceArgs): ClarityValue[];
        }
        namespace GetContractOwner {
            const name = "get-contract-owner";
        }
        namespace GetDecimals {
            const name = "get-decimals";
        }
        namespace GetName {
            const name = "get-name";
        }
        namespace GetSymbol {
            const name = "get-symbol";
        }
        namespace GetTokenUri {
            const name = "get-token-uri";
        }
        namespace GetTotalSupply {
            const name = "get-total-supply";
        }
    }
}
export declare namespace OwnableTraitContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "ownable-trait";
}
export declare namespace Sip010TraitFtStandardContract {
    const address = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE";
    const name = "sip-010-trait-ft-standard";
}
export declare namespace BridgeContract {
    const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const name = "bridge";
    namespace Functions {
        namespace AddToken {
            const name = "add-token";
            interface AddTokenArgs {
                tokenSource: BufferCV;
                token: ClarityValue;
                type: UIntCV;
                minFee: UIntCV;
            }
            function args(args: AddTokenArgs): ClarityValue[];
        }
        namespace Lock {
            const name = "lock";
            interface LockArgs {
                lockId: BufferCV;
                traitAddress: ClarityValue;
                amount: UIntCV;
                recipient: BufferCV;
                destination: BufferCV;
            }
            function args(args: LockArgs): ClarityValue[];
        }
        namespace RemoveToken {
            const name = "remove-token";
            interface RemoveTokenArgs {
                tokenSource: BufferCV;
                token: ClarityValue;
                newOwner: PrincipalCV;
            }
            function args(args: RemoveTokenArgs): ClarityValue[];
        }
        namespace SetBaseFeeRateBp {
            const name = "set-base-fee-rate-bp";
            interface SetBaseFeeRateBpArgs {
                value: UIntCV;
            }
            function args(args: SetBaseFeeRateBpArgs): ClarityValue[];
        }
        namespace SetContractOwner {
            const name = "set-contract-owner";
            interface SetContractOwnerArgs {
                owner: PrincipalCV;
            }
            function args(args: SetContractOwnerArgs): ClarityValue[];
        }
        namespace SetFeeCollector {
            const name = "set-fee-collector";
            interface SetFeeCollectorArgs {
                collector: PrincipalCV;
            }
            function args(args: SetFeeCollectorArgs): ClarityValue[];
        }
        namespace SetIsBridgeEnabled {
            const name = "set-is-bridge-enabled";
            interface SetIsBridgeEnabledArgs {
                enabled: BooleanCV;
            }
            function args(args: SetIsBridgeEnabledArgs): ClarityValue[];
        }
        namespace SetTokenMinFee {
            const name = "set-token-min-fee";
            interface SetTokenMinFeeArgs {
                nativeAddress: PrincipalCV;
                fee: UIntCV;
            }
            function args(args: SetTokenMinFeeArgs): ClarityValue[];
        }
        namespace SetValidatorPublicKey {
            const name = "set-validator-public-key";
            interface SetValidatorPublicKeyArgs {
                publicKey: BufferCV;
            }
            function args(args: SetValidatorPublicKeyArgs): ClarityValue[];
        }
        namespace Unlock {
            const name = "unlock";
            interface UnlockArgs {
                lockId: BufferCV;
                recipient: BufferCV;
                systemAmount: UIntCV;
                lockSource: BufferCV;
                token: ClarityValue;
                signature: BufferCV;
            }
            function args(args: UnlockArgs): ClarityValue[];
        }
        namespace FromSystemPrecision {
            const name = "from-system-precision";
            interface FromSystemPrecisionArgs {
                amount: UIntCV;
                precision: UIntCV;
            }
            function args(args: FromSystemPrecisionArgs): ClarityValue[];
        }
        namespace GetBaseFeeRateBp {
            const name = "get-base-fee-rate-bp";
        }
        namespace GetContractOwner {
            const name = "get-contract-owner";
        }
        namespace GetFeeCollector {
            const name = "get-fee-collector";
        }
        namespace GetIsBridgeEnabled {
            const name = "get-is-bridge-enabled";
        }
        namespace GetTokenBySource {
            const name = "get-token-by-source";
            interface GetTokenBySourceArgs {
                tokenSource: BufferCV;
            }
            function args(args: GetTokenBySourceArgs): ClarityValue[];
        }
        namespace GetTokenNative {
            const name = "get-token-native";
            interface GetTokenNativeArgs {
                nativeAddress: PrincipalCV;
            }
            function args(args: GetTokenNativeArgs): ClarityValue[];
        }
        namespace GetValidatorPublicKey {
            const name = "get-validator-public-key";
        }
        namespace ToSystemPrecision {
            const name = "to-system-precision";
            interface ToSystemPrecisionArgs {
                amount: UIntCV;
                precision: UIntCV;
            }
            function args(args: ToSystemPrecisionArgs): ClarityValue[];
        }
    }
}
