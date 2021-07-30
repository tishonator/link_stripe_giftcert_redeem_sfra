# Redeeming Gift Certificates in SFRA with link_stripe


Salesforce Commerce Cloud (SFCC) platform has built in Gift Certificate functionality, but unlike SiteGenesis, SFRA does not allow a customer to use Gift Certificates as a payment method by default.

The purpose of this cartridge (link_stripe_giftcert_redeem_sfra) is to demonstrate using of Gift Certificates (Full or Partial redemption) of SFCC Gift Certificates with stripe integration using their official cartridge: https://github.com/SalesforceCommerceCloud/link_stripe (You need to be assigned to SalesForce CommerceCloud Organization: https://github.com/SalesforceCommerceCloud to access that repo).

# Prerequisites

- SFRA ver. 6
- SFCC Stripe integration using link_stripe ver. 21.3.0 or newer

# Installation

- Business Manager (BM) > Merchant Tools >  Ordering >  Payment Methods > Enable Payment Method with ID = GIFT_CERTIFICATE and Payment Processor = BASIC_GIFT_CERTIFICATE

- BM > Administration >  Sites >  Manage Sites > You site (i.e. RefArch) > 'Settings' Tab > Cartridges > Add 'link_stripe_giftcert_redeem_sfra' at the beginning of the cartridges path, i.e. cartridges path = link_stripe_giftcert_redeem_sfra:app_stripe_sfra:int_stripe_sfra:int_stripe_core:app_storefront_base

# How to Test Gift Certificate Redemption

1. BM > Merchant Tools > Online Marketing > Gift Certificates > Click 'New' button
2. Fill the form (with valid email, small amount i.e. $10 to test partial redeem, or big amount i.e. $1000 to test full redeem, Status = 'Issued', and Enabled = 'Yes'):<br>
![BM Gift Cert](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/bm-gift-cert.png)
3. Click on 'Email Gift Certificate' button to receive gift certficate code
4. Open Storefront
5. Add Product(s) to the Basket
6. Proceed to the Checkout
7. Fill Shipping form and proceed to Payment step
8. Below Phone field, there should be displayed Gift Certificate Form:<br>
![Gift Cert Form](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/gift-cert-form.png)
9. Enter Gift Certificate Code and click 'Check Balance' to check the available Gift Certificate balance:<br>
![Gift Cert Balance](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/gift-cert-check-balance.png)
9. Enter Gift Certificate Code and click 'Redeem' to apply the Gift Certificate:<br>
![Gift Cert Balance](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/gift-cert-redeem.png)
10. Fill Stripe card form or Alternative Payment Methods (APM) and complete the Order
11. Open Order and BM and verify the order total amount is split between Gift Certificate and the selected Payment method:<br>
![Gift Cert Balance](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/sfra-gift-cert-order.png)
12. You can also open Stripe Dashboard and verify the proper amount has been authorized:
![Gift Cert Balance](https://raw.githubusercontent.com/tishonator/link_stripe_giftcert_redeem_sfra/main/stripe-gift-cert-order.png)


Please Note: link_stripe_giftcert_redeem_sfra is not supposed to be used on Production. It should be used as a Proof of Concept as a reference for link_stripe support of SFCC Gift Certificates Redemptions (Full or Partial).
