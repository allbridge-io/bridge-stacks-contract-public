"use strict";
// Code generated with the stacksjs-helper-generator extension
// Manual edits will be overwritten
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeContract = exports.Sip010TraitFtStandardContract = exports.OwnableTraitContract = exports.NativeTokenContract = exports.BridgeTokenTraitContract = exports.WstxContract = exports.WrappedTokenContract = void 0;
var WrappedTokenContract;
(function (WrappedTokenContract) {
    WrappedTokenContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    WrappedTokenContract.name = "wrapped-token";
    // Functions
    var Functions;
    (function (Functions) {
        // set-contract-owner
        var SetContractOwner;
        (function (SetContractOwner) {
            SetContractOwner.name = "set-contract-owner";
            function args(args) {
                return [
                    args.owner,
                ];
            }
            SetContractOwner.args = args;
        })(SetContractOwner = Functions.SetContractOwner || (Functions.SetContractOwner = {}));
        // set-token-uri
        var SetTokenUri;
        (function (SetTokenUri) {
            SetTokenUri.name = "set-token-uri";
            function args(args) {
                return [
                    args.value,
                ];
            }
            SetTokenUri.args = args;
        })(SetTokenUri = Functions.SetTokenUri || (Functions.SetTokenUri = {}));
        // transfer
        var Transfer;
        (function (Transfer) {
            Transfer.name = "transfer";
            function args(args) {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }
            Transfer.args = args;
        })(Transfer = Functions.Transfer || (Functions.Transfer = {}));
        // get-balance
        var GetBalance;
        (function (GetBalance) {
            GetBalance.name = "get-balance";
            function args(args) {
                return [
                    args.account,
                ];
            }
            GetBalance.args = args;
        })(GetBalance = Functions.GetBalance || (Functions.GetBalance = {}));
        // get-contract-owner
        var GetContractOwner;
        (function (GetContractOwner) {
            GetContractOwner.name = "get-contract-owner";
        })(GetContractOwner = Functions.GetContractOwner || (Functions.GetContractOwner = {}));
        // get-decimals
        var GetDecimals;
        (function (GetDecimals) {
            GetDecimals.name = "get-decimals";
        })(GetDecimals = Functions.GetDecimals || (Functions.GetDecimals = {}));
        // get-name
        var GetName;
        (function (GetName) {
            GetName.name = "get-name";
        })(GetName = Functions.GetName || (Functions.GetName = {}));
        // get-symbol
        var GetSymbol;
        (function (GetSymbol) {
            GetSymbol.name = "get-symbol";
        })(GetSymbol = Functions.GetSymbol || (Functions.GetSymbol = {}));
        // get-token-uri
        var GetTokenUri;
        (function (GetTokenUri) {
            GetTokenUri.name = "get-token-uri";
        })(GetTokenUri = Functions.GetTokenUri || (Functions.GetTokenUri = {}));
        // get-total-supply
        var GetTotalSupply;
        (function (GetTotalSupply) {
            GetTotalSupply.name = "get-total-supply";
        })(GetTotalSupply = Functions.GetTotalSupply || (Functions.GetTotalSupply = {}));
    })(Functions = WrappedTokenContract.Functions || (WrappedTokenContract.Functions = {}));
})(WrappedTokenContract = exports.WrappedTokenContract || (exports.WrappedTokenContract = {}));
var WstxContract;
(function (WstxContract) {
    WstxContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    WstxContract.name = "wstx";
    // Functions
    var Functions;
    (function (Functions) {
        // approve-contract
        var ApproveContract;
        (function (ApproveContract) {
            ApproveContract.name = "approve-contract";
            function args(args) {
                return [
                    args.contract,
                ];
            }
            ApproveContract.args = args;
        })(ApproveContract = Functions.ApproveContract || (Functions.ApproveContract = {}));
        // disapprove-contract
        var DisapproveContract;
        (function (DisapproveContract) {
            DisapproveContract.name = "disapprove-contract";
            function args(args) {
                return [
                    args.contract,
                ];
            }
            DisapproveContract.args = args;
        })(DisapproveContract = Functions.DisapproveContract || (Functions.DisapproveContract = {}));
        // set-contract-owner
        var SetContractOwner;
        (function (SetContractOwner) {
            SetContractOwner.name = "set-contract-owner";
            function args(args) {
                return [
                    args.owner,
                ];
            }
            SetContractOwner.args = args;
        })(SetContractOwner = Functions.SetContractOwner || (Functions.SetContractOwner = {}));
        // set-token-uri
        var SetTokenUri;
        (function (SetTokenUri) {
            SetTokenUri.name = "set-token-uri";
            function args(args) {
                return [
                    args.value,
                ];
            }
            SetTokenUri.args = args;
        })(SetTokenUri = Functions.SetTokenUri || (Functions.SetTokenUri = {}));
        // transfer
        var Transfer;
        (function (Transfer) {
            Transfer.name = "transfer";
            function args(args) {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }
            Transfer.args = args;
        })(Transfer = Functions.Transfer || (Functions.Transfer = {}));
        // get-balance
        var GetBalance;
        (function (GetBalance) {
            GetBalance.name = "get-balance";
            function args(args) {
                return [
                    args.account,
                ];
            }
            GetBalance.args = args;
        })(GetBalance = Functions.GetBalance || (Functions.GetBalance = {}));
        // get-contract-owner
        var GetContractOwner;
        (function (GetContractOwner) {
            GetContractOwner.name = "get-contract-owner";
        })(GetContractOwner = Functions.GetContractOwner || (Functions.GetContractOwner = {}));
        // get-decimals
        var GetDecimals;
        (function (GetDecimals) {
            GetDecimals.name = "get-decimals";
        })(GetDecimals = Functions.GetDecimals || (Functions.GetDecimals = {}));
        // get-name
        var GetName;
        (function (GetName) {
            GetName.name = "get-name";
        })(GetName = Functions.GetName || (Functions.GetName = {}));
        // get-symbol
        var GetSymbol;
        (function (GetSymbol) {
            GetSymbol.name = "get-symbol";
        })(GetSymbol = Functions.GetSymbol || (Functions.GetSymbol = {}));
        // get-token-uri
        var GetTokenUri;
        (function (GetTokenUri) {
            GetTokenUri.name = "get-token-uri";
        })(GetTokenUri = Functions.GetTokenUri || (Functions.GetTokenUri = {}));
        // get-total-supply
        var GetTotalSupply;
        (function (GetTotalSupply) {
            GetTotalSupply.name = "get-total-supply";
        })(GetTotalSupply = Functions.GetTotalSupply || (Functions.GetTotalSupply = {}));
    })(Functions = WstxContract.Functions || (WstxContract.Functions = {}));
})(WstxContract = exports.WstxContract || (exports.WstxContract = {}));
var BridgeTokenTraitContract;
(function (BridgeTokenTraitContract) {
    BridgeTokenTraitContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    BridgeTokenTraitContract.name = "bridge-token-trait";
})(BridgeTokenTraitContract = exports.BridgeTokenTraitContract || (exports.BridgeTokenTraitContract = {}));
var NativeTokenContract;
(function (NativeTokenContract) {
    NativeTokenContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    NativeTokenContract.name = "native-token";
    // Functions
    var Functions;
    (function (Functions) {
        // set-contract-owner
        var SetContractOwner;
        (function (SetContractOwner) {
            SetContractOwner.name = "set-contract-owner";
            function args(args) {
                return [
                    args.owner,
                ];
            }
            SetContractOwner.args = args;
        })(SetContractOwner = Functions.SetContractOwner || (Functions.SetContractOwner = {}));
        // set-precision
        var SetPrecision;
        (function (SetPrecision) {
            SetPrecision.name = "set-precision";
            function args(args) {
                return [
                    args.value,
                ];
            }
            SetPrecision.args = args;
        })(SetPrecision = Functions.SetPrecision || (Functions.SetPrecision = {}));
        // set-token-uri
        var SetTokenUri;
        (function (SetTokenUri) {
            SetTokenUri.name = "set-token-uri";
            function args(args) {
                return [
                    args.value,
                ];
            }
            SetTokenUri.args = args;
        })(SetTokenUri = Functions.SetTokenUri || (Functions.SetTokenUri = {}));
        // transfer
        var Transfer;
        (function (Transfer) {
            Transfer.name = "transfer";
            function args(args) {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }
            Transfer.args = args;
        })(Transfer = Functions.Transfer || (Functions.Transfer = {}));
        // get-balance
        var GetBalance;
        (function (GetBalance) {
            GetBalance.name = "get-balance";
            function args(args) {
                return [
                    args.account,
                ];
            }
            GetBalance.args = args;
        })(GetBalance = Functions.GetBalance || (Functions.GetBalance = {}));
        // get-contract-owner
        var GetContractOwner;
        (function (GetContractOwner) {
            GetContractOwner.name = "get-contract-owner";
        })(GetContractOwner = Functions.GetContractOwner || (Functions.GetContractOwner = {}));
        // get-decimals
        var GetDecimals;
        (function (GetDecimals) {
            GetDecimals.name = "get-decimals";
        })(GetDecimals = Functions.GetDecimals || (Functions.GetDecimals = {}));
        // get-name
        var GetName;
        (function (GetName) {
            GetName.name = "get-name";
        })(GetName = Functions.GetName || (Functions.GetName = {}));
        // get-symbol
        var GetSymbol;
        (function (GetSymbol) {
            GetSymbol.name = "get-symbol";
        })(GetSymbol = Functions.GetSymbol || (Functions.GetSymbol = {}));
        // get-token-uri
        var GetTokenUri;
        (function (GetTokenUri) {
            GetTokenUri.name = "get-token-uri";
        })(GetTokenUri = Functions.GetTokenUri || (Functions.GetTokenUri = {}));
        // get-total-supply
        var GetTotalSupply;
        (function (GetTotalSupply) {
            GetTotalSupply.name = "get-total-supply";
        })(GetTotalSupply = Functions.GetTotalSupply || (Functions.GetTotalSupply = {}));
    })(Functions = NativeTokenContract.Functions || (NativeTokenContract.Functions = {}));
})(NativeTokenContract = exports.NativeTokenContract || (exports.NativeTokenContract = {}));
var OwnableTraitContract;
(function (OwnableTraitContract) {
    OwnableTraitContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    OwnableTraitContract.name = "ownable-trait";
})(OwnableTraitContract = exports.OwnableTraitContract || (exports.OwnableTraitContract = {}));
var Sip010TraitFtStandardContract;
(function (Sip010TraitFtStandardContract) {
    Sip010TraitFtStandardContract.address = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE";
    Sip010TraitFtStandardContract.name = "sip-010-trait-ft-standard";
})(Sip010TraitFtStandardContract = exports.Sip010TraitFtStandardContract || (exports.Sip010TraitFtStandardContract = {}));
var BridgeContract;
(function (BridgeContract) {
    BridgeContract.address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    BridgeContract.name = "bridge";
    // Functions
    var Functions;
    (function (Functions) {
        // add-token
        var AddToken;
        (function (AddToken) {
            AddToken.name = "add-token";
            function args(args) {
                return [
                    args.tokenSource,
                    args.token,
                    args.type,
                    args.minFee,
                ];
            }
            AddToken.args = args;
        })(AddToken = Functions.AddToken || (Functions.AddToken = {}));
        // lock
        var Lock;
        (function (Lock) {
            Lock.name = "lock";
            function args(args) {
                return [
                    args.lockId,
                    args.traitAddress,
                    args.amount,
                    args.recipient,
                    args.destination,
                ];
            }
            Lock.args = args;
        })(Lock = Functions.Lock || (Functions.Lock = {}));
        // remove-token
        var RemoveToken;
        (function (RemoveToken) {
            RemoveToken.name = "remove-token";
            function args(args) {
                return [
                    args.tokenSource,
                    args.token,
                    args.newOwner,
                ];
            }
            RemoveToken.args = args;
        })(RemoveToken = Functions.RemoveToken || (Functions.RemoveToken = {}));
        // set-base-fee-rate-bp
        var SetBaseFeeRateBp;
        (function (SetBaseFeeRateBp) {
            SetBaseFeeRateBp.name = "set-base-fee-rate-bp";
            function args(args) {
                return [
                    args.value,
                ];
            }
            SetBaseFeeRateBp.args = args;
        })(SetBaseFeeRateBp = Functions.SetBaseFeeRateBp || (Functions.SetBaseFeeRateBp = {}));
        // set-contract-owner
        var SetContractOwner;
        (function (SetContractOwner) {
            SetContractOwner.name = "set-contract-owner";
            function args(args) {
                return [
                    args.owner,
                ];
            }
            SetContractOwner.args = args;
        })(SetContractOwner = Functions.SetContractOwner || (Functions.SetContractOwner = {}));
        // set-fee-collector
        var SetFeeCollector;
        (function (SetFeeCollector) {
            SetFeeCollector.name = "set-fee-collector";
            function args(args) {
                return [
                    args.collector,
                ];
            }
            SetFeeCollector.args = args;
        })(SetFeeCollector = Functions.SetFeeCollector || (Functions.SetFeeCollector = {}));
        // set-is-bridge-enabled
        var SetIsBridgeEnabled;
        (function (SetIsBridgeEnabled) {
            SetIsBridgeEnabled.name = "set-is-bridge-enabled";
            function args(args) {
                return [
                    args.enabled,
                ];
            }
            SetIsBridgeEnabled.args = args;
        })(SetIsBridgeEnabled = Functions.SetIsBridgeEnabled || (Functions.SetIsBridgeEnabled = {}));
        // set-token-min-fee
        var SetTokenMinFee;
        (function (SetTokenMinFee) {
            SetTokenMinFee.name = "set-token-min-fee";
            function args(args) {
                return [
                    args.nativeAddress,
                    args.fee,
                ];
            }
            SetTokenMinFee.args = args;
        })(SetTokenMinFee = Functions.SetTokenMinFee || (Functions.SetTokenMinFee = {}));
        // set-validator-public-key
        var SetValidatorPublicKey;
        (function (SetValidatorPublicKey) {
            SetValidatorPublicKey.name = "set-validator-public-key";
            function args(args) {
                return [
                    args.publicKey,
                ];
            }
            SetValidatorPublicKey.args = args;
        })(SetValidatorPublicKey = Functions.SetValidatorPublicKey || (Functions.SetValidatorPublicKey = {}));
        // unlock
        var Unlock;
        (function (Unlock) {
            Unlock.name = "unlock";
            function args(args) {
                return [
                    args.lockId,
                    args.recipient,
                    args.systemAmount,
                    args.lockSource,
                    args.token,
                    args.signature,
                ];
            }
            Unlock.args = args;
        })(Unlock = Functions.Unlock || (Functions.Unlock = {}));
        // from-system-precision
        var FromSystemPrecision;
        (function (FromSystemPrecision) {
            FromSystemPrecision.name = "from-system-precision";
            function args(args) {
                return [
                    args.amount,
                    args.precision,
                ];
            }
            FromSystemPrecision.args = args;
        })(FromSystemPrecision = Functions.FromSystemPrecision || (Functions.FromSystemPrecision = {}));
        // get-base-fee-rate-bp
        var GetBaseFeeRateBp;
        (function (GetBaseFeeRateBp) {
            GetBaseFeeRateBp.name = "get-base-fee-rate-bp";
        })(GetBaseFeeRateBp = Functions.GetBaseFeeRateBp || (Functions.GetBaseFeeRateBp = {}));
        // get-contract-owner
        var GetContractOwner;
        (function (GetContractOwner) {
            GetContractOwner.name = "get-contract-owner";
        })(GetContractOwner = Functions.GetContractOwner || (Functions.GetContractOwner = {}));
        // get-fee-collector
        var GetFeeCollector;
        (function (GetFeeCollector) {
            GetFeeCollector.name = "get-fee-collector";
        })(GetFeeCollector = Functions.GetFeeCollector || (Functions.GetFeeCollector = {}));
        // get-is-bridge-enabled
        var GetIsBridgeEnabled;
        (function (GetIsBridgeEnabled) {
            GetIsBridgeEnabled.name = "get-is-bridge-enabled";
        })(GetIsBridgeEnabled = Functions.GetIsBridgeEnabled || (Functions.GetIsBridgeEnabled = {}));
        // get-token-by-source
        var GetTokenBySource;
        (function (GetTokenBySource) {
            GetTokenBySource.name = "get-token-by-source";
            function args(args) {
                return [
                    args.tokenSource,
                ];
            }
            GetTokenBySource.args = args;
        })(GetTokenBySource = Functions.GetTokenBySource || (Functions.GetTokenBySource = {}));
        // get-token-native
        var GetTokenNative;
        (function (GetTokenNative) {
            GetTokenNative.name = "get-token-native";
            function args(args) {
                return [
                    args.nativeAddress,
                ];
            }
            GetTokenNative.args = args;
        })(GetTokenNative = Functions.GetTokenNative || (Functions.GetTokenNative = {}));
        // get-validator-public-key
        var GetValidatorPublicKey;
        (function (GetValidatorPublicKey) {
            GetValidatorPublicKey.name = "get-validator-public-key";
        })(GetValidatorPublicKey = Functions.GetValidatorPublicKey || (Functions.GetValidatorPublicKey = {}));
        // to-system-precision
        var ToSystemPrecision;
        (function (ToSystemPrecision) {
            ToSystemPrecision.name = "to-system-precision";
            function args(args) {
                return [
                    args.amount,
                    args.precision,
                ];
            }
            ToSystemPrecision.args = args;
        })(ToSystemPrecision = Functions.ToSystemPrecision || (Functions.ToSystemPrecision = {}));
    })(Functions = BridgeContract.Functions || (BridgeContract.Functions = {}));
})(BridgeContract = exports.BridgeContract || (exports.BridgeContract = {}));
