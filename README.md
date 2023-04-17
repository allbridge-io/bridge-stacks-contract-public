The repository contains bridge contracts and tests for them.

# Bridge contract
A bridge contract is a contract that allows the transfer of tokens between blockchains. It is a part of Allbridge Classic.
1. #### Bridge contract implements the following admin methods:
    - `add-token` - adds base/native/wrapped token to the bridge

        arguments: 
        - `token source` (buffer) - encoded source address
        - `token` (trait `<bridge-token>` or `<sip-010-trait>`) - trait address on Stacks blockchain 
        - `type` (uint) - one of u100/u200/u300 which represents STX/native token/wrapped token 
        - `min-fee` (uint) - min token fee (may be adjusted later using `set-token-min-fee` method)
    - `remove-token` - removes base/native/wrapped token from the bridge

        arguments: 
        - `token source` (buffer) - encoded source address
        - `token` (trait `<bridge-token>` or `<sip-010-trait>`) - trait address on Stacks blockchain 
        - `new-owner` (principal) - the new owner of the token balance and in the case of the wrapped token - the new owner of the wrapped token
    - `set-is-bridge-enabled` - enables/disables bridge

        arguments: 
        - `is-enabled` (bool) - true/false
    - `set-base-fee-rate-bp` - sets base fee rate in basis points
        
        arguments: 
        - `value` (uint) - base fee rate in basis points. Should be greater than 0 and less than 10000
    - `set-token-min-fee` - sets a minimum fee for token 
        
        arguments: 
        - `token address` (principal) - token address on Stacks blockchain
        - `fee` (uint) - new min token fee
    - `set-contract-owner` - sets contract owner principal
        
        arguments: 
        - `new-owner` (principal) - new contract owner principal
    - `set-fee-collector` - sets fees collector principal

        arguments: 
        - `collector` (principal) - new fees collector principal
    - `set-validator-public-key` - sets validator public key

        arguments: 
        - `public-key` (buffer) - validator public key


2. #### Bridge contract implements the following read-only methods:
    - `get-token-by-source` - returns token principal by `token-source` and `token-address`
    
        throws error `u10001` if the token is not found

        arguments: 
        - `token source` (buffer) - encoded source address
    - `get-token-native` - returns token configuration by `token-address`
    
        throws error `u10001` if the token is not found

        arguments: 
        - `token address` (principal) - token address on Stacks blockchain
    - `get-contract-owner` - returns contract owner principal
    - `get-base-fee-rate-bp` - returns base fee rate in basis points
    - `get-fee-collector` - returns fees collector principal
    - `get-validator-public-key` - returns validator public key
    - `get-is-bridge-enabled` - returns true if a bridge is enabled


3. #### Bridge contract implements the following logic to transfer tokens:
 
    1. `lock` - the method used to lock assets on the Stacks blockchain, so afterwards it is possible to receive assets on another blockchain

        arguments: 
        + `lock-id` (buff) - unique ID generated with extra secure logic, which is used afterwards to unlock assets on another blockchain
        + `token` (trait `<sip-010>`) - token trait address on Stacks blockchain
        + `amount` (uint) - amount to lock in token precision
        + `recipient` (buff) - recipient address on another blockchain
        + `destination` (buff) - encoded destination chain identifier

        > After the `lock` method is called, the following logic is executed:
        >1. `is-bridge-enabled` flag validated. If the bridge is disabled, the method throws the error `u777`
        >2. input parameters are validated (the amount is greater than 0, the token is registered in the bridge, and the destination is valid). If validation fails, the method throws an error with an error code regarding to failed assertion.
        >3. `fee` is calculated. `fee` is calculated as `amount * base-fee-rate-bp / 10000`. If `fee` is less than `min-fee` for the token, `fee` is set to `min-fee`
        >4. `lock-id` is validated. If `lock-id` is already used, the method throws the error `u10006`. Otherwise, `lock-id` is added to the map of locks with details of it.
        >5. `fee` is transferred to the `fee-collector` principal
        >6. `amount` without fee is transferred to the `bridge` principal
   2. `unlock` - the method used to unlock assets on the Stacks blockchain after the lock on other blockchain is confirmed

        arguments: 
        + `lock-id` (buff) - unique ID generated with extra secure logic, which is used afterwards to unlock assets on another blockchain
        + `recipient` (buff) - recipient address on stacks blockchain will be constructed to principal
        + `amount` (uint) - amount to unlock in system precision
        + `lock-source` (buff) - encoded source chain identifier
        + `token` (trait `<sip-010>`) - token trait address on Stacks blockchain    
        + `signature` (buff) - the signature of the lock transaction on another blockchain

        > After the `unlock` method is called, the following logic is executed:
        >1. `is-bridge-enabled` flag validated. If the bridge is disabled, the method throws the error `u777`
        >2. input parameters are validated (amount is greater than 0, the token is registered in the bridge, lock-source is valid). If validation fails, the method throws an error with an error code regarding to failed assertion.
        >3. `lock-source` is validated. If `lock-source` is not valid, the method throws the error `u20001`.
        >4. `lock-id` is validated. If `lock-id` is not found in the map of unlocks, the method throws the error `u10008`.
        >5. `signature` is validated. If `signature` is not valid, the method throws the error `u10012`.
        >6. Information about `unlock` is added to the map of unlocks with details of it, so that it is not possible to unlock the same `lock-id` twice.
        >7. `amount` is transferred to the `recipient` principal

# Traits

1. #### Bridge token trait implements the following traits:
    1. `<sip-010>` methods:

        - `transfer` - transfers tokens from the caller to the specified principal
        - `get-name` - returns the human-readable name of the token
        - `get-symbol` - returns the token symbol
        - `get-decimals` - returns the number of token decimals
        - `get-balance` - returns the balance of the passed principal
        - `get-total-supply` - returns the current total supply
        - `get-token-uri` - returns an optional URI that represents the metadata of this token

    2. `<ownable-trait>` methods:

        - `get-contract-owner` - returns the owner of the contract
        - `set-contract-owner` - sets the owner of the contract

2. #### Ownable trait implements the following methods:
   - `get-contract-owner` - returns the owner of the contract
   - `set-contract-owner` - sets the owner of the contract

3. #### SIP-010 trait implements the following methods:
   - `transfer` - transfers tokens from the caller to the specified principal
   - `get-name` - returns the human-readable name of the token
   - `get-symbol` - returns the token symbol
   - `get-decimals` - returns the number of token decimals
   - `get-balance` - returns the balance of the passed principal
   - `get-total-supply` - returns the current total supply
   - `get-token-uri` - returns an optional URI that represents the metadata of this token


# Tokens

1. #### Wrapped STX token implemented to be compatible with `<sip-010>` trait and so all methods of `<sip-010>` trait are implemented for wrapped STX token. In addition, wrapped STX token implements the following methods:
   - `approve-contract` - approves contract to transfer tokens on behalf of the caller

     arguments: 
     - `contract` (principal) - contract principal

   - `disapprove-contract` - disapproves contract to transfer tokens on behalf of the caller

     arguments: 
     - `contract` (principal) - contract principal

   - `set-contract-owner` - sets contract owner principal

     arguments: 
     - `new-owner` (principal) - new contract owner principal

   - `get-contract-owner` - returns contract owner principal

    > Additionally, the `transfer` method of wrapped STX token is implemented so that only approved contracts can transfer tokens on behalf of the caller.


2. #### Wrapped token is implemented to be compatible with `<sip-010>` trait and so all methods of `<sip-010>` trait are implemented for wrapped token and also `<ownable-trait>` trait is implemented. In addition to that, wrapped token are implemented in a way that only the owner(bridge contract) can mint or burn tokens. Otherwise, the wrapped token will be transferable only between accounts.

3. #### Native token represents token owned by someone on Stacks blockchain so that it is possible only to transfer tokens between the bridge and another account. No minting or burning by bridge contract is possible.