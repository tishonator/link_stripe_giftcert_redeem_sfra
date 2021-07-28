'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');
var GiftCertMgr = require('dw/order/GiftCertificateMgr');
var GiftCert = require('dw/order/GiftCertificate');
var Resource = require('dw/web/Resource');
var Money = require('dw/value/Money');

var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

server.get('Landing', server.middleware.https, function (req, res, next) {
    res.render('/giftCertificate/giftCertificateLanding');

    next();
});

server.get('Add', server.middleware.https, function(req, res, next) {
    var giftCert = GiftCertMgr.getGiftCertificateByCode(req.querystring.giftCertCode);

    if (!giftCert) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.not.found', 'giftCertificate', null)
        });
        return next();
    }

    var giftCertStatus = giftCert.getStatus();
    var statusCodes = {
        0: 'STATUS_PENDING',
        1: 'STATUS_ISSUED',
        2: 'STATUS_PARTIALLY_REDEEMED',
        3: 'STATUS_REDEEMED'
    };

    var giftCertBalanceAndCurrency = '';
    var giftCertBalanceValue;
    var giftCertCurrency = '';
    var giftCertMessage = '';
    if (giftCertStatus === 1 || giftCertStatus === 2) {
        giftCertBalanceAndCurrency = giftCert.getBalance().toString();
        giftCertCurrency = giftCert.getBalance().getCurrencyCode();
        giftCertBalanceValue = giftCert.getBalance().getValue();
        giftCertMessage = Resource.msg('msg.status.issued.or.partially.redeemed', 'giftCertificate', null) + giftCertBalanceAndCurrency;
    } else if (giftCertStatus === 0) {
        giftCertMessage = Resource.msg('msg.status.pending', 'giftCertificate', null);
    } else if (giftCertStatus === 3) {
        giftCertMessage = Resource.msg('msg.status.redeemed', 'giftCertificate', null);
    }

    res.json({
        error: false,
        status: statusCodes[giftCertStatus],
        balanceValue: giftCertBalanceValue,
        balanceCurrency: giftCertCurrency,
        message: giftCertMessage
    });

    next();
});

server.get('Redeem', server.middleware.https, function(req, res, next) {
	var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return next();
    }

    var giftCert = GiftCertMgr.getGiftCertificateByCode(req.querystring.giftCertCode);
    if (!giftCert) {// make sure exists
        res.json({
            error: true,
            errorMessage: GiftCertificateStatusCodes.GIFTCERTIFICATE_NOT_FOUND
        });
        return next();
    } else if (!giftCert.isEnabled()) {// make sure it is enabled
    	res.json({
            error: true,
            errorMessage: GiftCertificateStatusCodes.GIFTCERTIFICATE_DISABLED
        });
        return next();
    } else if (giftCert.getStatus() === GiftCert.STATUS_PENDING) {// make sure it is available for use
    	res.json({
            error: true,
            errorMessage: GiftCertificateStatusCodes.GIFTCERTIFICATE_PENDING
        });
        return next();
    } else if (giftCert.getStatus() === GiftCert.STATUS_REDEEMED) {// make sure it has not been fully redeemed
    	res.json({
            error: true,
            errorMessage: GiftCertificateStatusCodes.GIFTCERTIFICATE_INSUFFICIENT_BALANCE
        });
        return next();
    } else if (giftCert.balance.currencyCode !== currentBasket.getCurrencyCode()) {// make sure the GC is in the right currency
    	res.json({
            error: true,
            errorMessage: GiftCertificateStatusCodes.GIFTCERTIFICATE_CURRENCY_MISMATCH
        });
        return next();
    } else {
    	
    	Transaction.wrap(function () {
            
            // Removes any duplicates.
            // Iterates over the list of payment instruments to check.
            var gcPaymentInstrs = currentBasket.getGiftCertificatePaymentInstruments(giftCert.getGiftCertificateCode()).iterator();
            var existingPI = null;

            // Removes found gift certificates, to prevent duplicates.
            while (gcPaymentInstrs.hasNext()) {
                existingPI = gcPaymentInstrs.next();
                currentBasket.removePaymentInstrument(existingPI);
            }

            // Fetches the balance and the order total.
            var balance = giftCert.getBalance();
            var orderTotal = currentBasket.getTotalGrossPrice();

            // Sets the amount to redeem equal to the remaining balance.
            var amountToRedeem = balance;

            // Since there may be multiple gift certificates, adjusts the amount applied to the current
            // gift certificate based on the order total minus the aggregate amount of the current gift certificates.

            var giftCertTotal = new Money(0.0, currentBasket.getCurrencyCode());

            // Iterates over the list of gift certificate payment instruments
            // and updates the total redemption amount.
            gcPaymentInstrs = currentBasket.getGiftCertificatePaymentInstruments().iterator();
            var orderPI = null;

            while (gcPaymentInstrs.hasNext()) {
                orderPI = gcPaymentInstrs.next();
                giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
            }

            // Calculates the remaining order balance.
            // This is the remaining open order total that must be paid.
            var orderBalance = orderTotal.subtract(giftCertTotal);

            // The redemption amount exceeds the order balance.
            // use the order balance as maximum redemption amount.
            if (orderBalance < amountToRedeem) {
                // Sets the amount to redeem equal to the order balance.
                amountToRedeem = orderBalance;
            }

            // Creates a payment instrument from this gift certificate.
            var giftCertPI = currentBasket.createGiftCertificatePaymentInstrument(giftCert.getGiftCertificateCode(), amountToRedeem);
            
            COHelpers.recalculateBasket(currentBasket);
            
            res.json({
                error: false,
                message: Resource.msgf('billing.giftcertredeemed', 'giftCertificate', null, giftCertPI.paymentTransaction.amount, giftCertPI.getMaskedGiftCertificateCode())
            });
        });
    }

    next();
});


module.exports = server.exports();