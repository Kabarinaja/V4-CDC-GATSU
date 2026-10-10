# MY CDC GATSU — Implementation Notes

## Data and deployment safety

- Existing Firebase project configuration and Cloudinary helper/preset are retained.
- No production data or member accounts are deleted. The dedicated orphaned POS page and OTP modal component were removed; the former offline-POS creation UI is removed from member management. Existing order documents and transaction/point ledgers remain untouched.
- Deploy the updated rules with `firebase deploy --only firestore:rules`. No new composite index is required by the current top-up queries. Review and deploy the rules to the intended Firebase project before releasing the frontend.
- New collections: `topUpRequests`, `adminBalances/main`, `adminBalanceLedger`, and `appSettings/payment`. The payment settings document only exposes the QRIS image URL; writes are admin-only. Internal balance and its ledger are admin-only, and the rules prevent a negative stored balance.
- Top-up approval and direct-admin top-up use Firestore transactions: request status/balance/member points/point ledger/admin ledger/log commit together, and approval checks the pending status and available balance on every transaction retry. Only an authorized admin can execute these writes under Firestore Rules. This version does not add Cloud Functions; if the deployment requires protection against a compromised/malicious admin client rather than trusted admin-only operations, move balance/ledger mutation into callable Cloud Functions before production rollout.
- Cloudinary unsigned upload URLs are publicly addressable if someone obtains the URL. The UI only shows proofs to the owner/admin, but strict non-public proof delivery requires a trusted signed-upload/private-delivery backend.

## Reward points assumption (requires business confirmation)

The provided anchor examples are implemented exactly: Rp10,000→0.5; Rp12,000→1; Rp14,000→1.5; Rp16,000→2; Rp18,000→2.5; Rp32,000→4. Other totals use piecewise linear interpolation between anchors rounded to the nearest 0.5 point (below Rp10,000 yields 0; above Rp32,000 extrapolates the last segment). The examples do not define one consistent linear rate, so confirm this provisional general rule before treating it as final policy.

Rewards are based on `order.subtotal` (menu subtotal before point discount and excluding shipping), preserving the existing behavior. Order completion re-reads the order in a Firestore transaction and awards only if it is not already completed. Payment verification checks the current point balance before deducting redeemed points, preventing concurrent orders from overspending the same points.

## Custom top-up discount

Custom nominal values must be multiples of Rp100, matching 1 point = Rp100. For nominal values up to Rp35,000, the promo ratio is 18,999/20,000 (200-point package); above Rp35,000, the ratio is 48,999/50,000 (500-point package). The result is rounded to the nearest rupiah. Rp35,000 is the midpoint between the two package nominal values, with ties assigned to the 200-point ratio.

## QRIS

Checkout already referenced an external QRIS image; its merchant validity cannot be established from repository code alone. Admins can now upload the actual merchant-issued QRIS image to Cloudinary and save it in `appSettings/payment`; checkout and top-up read that setting. Confirm merchant identity and test with a small payment before production use. No QR code is generated or fabricated by the app.

## Daily reports and archive

Reports use the `Asia/Jakarta` calendar date and allow selecting previous dates. Archiving is soft: only completed orders can be archived after confirmation. The original order, member profile, point balance, point ledger, and top-up ledger are retained. Archived orders are excluded from active revenue summaries.
