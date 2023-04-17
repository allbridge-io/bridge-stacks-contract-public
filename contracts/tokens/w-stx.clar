(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-WRONG-PRINCIPAL (err u101))
(define-constant ERR-WRONG-AMOUNT (err u102))
(define-constant PRECISION u6)
(define-map approved-contracts principal bool)

(define-data-var token-uri (string-utf8 256) u"")
(define-data-var contract-owner principal tx-sender)

(define-read-only 
	(get-contract-owner)
  	(ok (var-get contract-owner))
)

(define-public 
	(set-contract-owner (owner principal))
	(begin
		(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-standard owner) ERR-NOT-AUTHORIZED)
		(ok (var-set contract-owner owner))
	)
)

(define-public 
	(approve-contract (contract principal))
	(begin
		(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-standard contract) ERR-NOT-AUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public 
	(disapprove-contract (contract principal))
	(begin
		(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
		(asserts! (is-standard contract) ERR-NOT-AUTHORIZED)
		(ok (map-delete approved-contracts contract))
	)
)

(define-fungible-token wstx)

(define-read-only (get-total-supply)
  	(ok u0)
)

(define-read-only 
	(get-name)
  	(ok "Wrapped STX")
)

(define-read-only 
	(get-symbol)
  (	ok "wstx")
)

(define-read-only 
	(get-decimals)
   	(ok PRECISION)
)

(define-read-only 
	(get-balance 
		(account principal)
	)
  	(ok (stx-get-balance account))
)

(define-public 
	(set-token-uri 
		(value (string-utf8 256))
	)
	(begin
		(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
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
		(asserts! (and (is-eq sender tx-sender) 
						(or (is-eq contract-caller (var-get contract-owner))
							(is-some (map-get? approved-contracts recipient))
							(is-some (map-get? approved-contracts sender))))
						ERR-NOT-AUTHORIZED)
		(if (is-none memo)
			(stx-transfer? amount sender recipient)
			(stx-transfer-memo? amount sender recipient (unwrap-panic memo))
		)
	)
)