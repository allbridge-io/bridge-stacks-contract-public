(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-WRONG-PRINCIPAL (err u101))
(define-constant ERR-WRONG-AMOUNT (err u102))
(define-map approved-contracts principal bool)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var precision uint u9)
(define-data-var contract-owner principal contract-caller)

(define-read-only 
	(get-contract-owner)
  	(ok (var-get contract-owner))
)

(define-public 
	(set-contract-owner (owner principal))
	(begin
		(asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-standard owner) ERR-NOT-AUTHORIZED)
		(ok (var-set contract-owner owner))
	)
)

(define-fungible-token native-token)

(define-read-only 
	(get-total-supply)
  	(ok (ft-get-supply native-token))
)

(define-read-only 
	(get-name)
  	(ok "Native Token")
)

(define-read-only 
	(get-symbol)
  (	ok "nTOKEN")
)

(define-read-only 
	(get-decimals)
   	(ok (var-get precision))
)

(define-public
	(set-precision (value uint))
	(begin
		(asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-eq (> value u0) true) ERR-NOT-AUTHORIZED)
		(ok (var-set precision value))
	)
)

(define-read-only 
	(get-balance 
		(account principal)
	)
  	(ok (ft-get-balance native-token account))
)

(define-public 
	(set-token-uri 
		(value (string-utf8 256))
	)
	(begin
		(asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-eq (> (len value) u0) true) ERR-NOT-AUTHORIZED)
		(ok (var-set token-uri value))
	)
)

(define-read-only 
	(get-token-uri)
  	(ok (some (var-get token-uri)))
)

(define-public 
	(transfer 
		(amount uint) 
		(sender principal) 
		(recipient principal) 
		(memo (optional (buff 34)))
	)
	(begin
		(asserts! (is-standard sender) ERR-WRONG-PRINCIPAL)
		(asserts! (is-standard recipient) ERR-WRONG-PRINCIPAL)
		(asserts! (is-eq (> amount u0) true) ERR-WRONG-AMOUNT)
		(transfer! amount sender recipient memo)
	)
)

;; Mint tokens
(define-public 
	(mint
		(recipient principal)
		(amount uint)
		(memo (optional (buff 34)))
	)
	(begin
		(asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(print { action: "mint-tokens", mint-amount: amount, mint-to: recipient })
		(match 
			(ft-mint? native-token amount recipient)
			response (begin
				(print memo)
				(ok response)
			)
			error (err error)
		)
	)
)

;; Burn tokens
(define-public 
	(burn 
		(sender principal)
		(amount uint)
		(memo (optional (buff 34)))
	)
	(begin
		(asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(print { action: "burn-tokens", burn-amount: amount, burn-from: sender })
		(match 
			(ft-burn? native-token amount sender)
			response (begin
				(print memo)
				(ok response)
			)
			error (err error)
		)
	)
)

;; Burn tokens
(define-private 
	(transfer! 
		(amount uint)
		(sender principal)
		(recipient principal)
		(memo (optional (buff 34)))
	)
	(begin 
		(asserts! (is-eq sender tx-sender) ERR-NOT-AUTHORIZED)
		(print { action: "transfer-tokens", amount: amount, sender: sender, recipient: recipient })
		(match 
			(ft-transfer? native-token amount sender recipient)
			response (begin
				(print memo)
				(ok response)
			)
			error (err error)
		)
	)
)