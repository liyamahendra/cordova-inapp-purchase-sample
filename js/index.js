/*
 * Copyright (c) 2014, Jean-Christophe Hoelt <hoelt@fovea.cc>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Our application's global object
var app = {};

//
// Constructor
// -----------
//

app.initialize = function() {
    log('initialize');

    // Listen to the deviceready event.
    // Make sure the score of 'this' isn't lost.
    document.addEventListener('deviceready', this.bind(this.onDeviceReady), false);
};

//
// Methods
// -------
//

// deviceready event handler.
//
// will just initialize the Purchase plugin
app.onDeviceReady = function() {
    log('onDeviceReady');
    this.initStore();
};

// initialize the purchase plugin if available
app.initStore = function() {

    if (!window.store) {
        log('Store not available');
        return;
    }

    // Enable maximum logging level
    store.verbosity = store.DEBUG;

    // Enable remote receipt validation
    store.validator = "https://api.fovea.cc:1982/check-purchase";

    // Inform the store of your products
    log('registerProducts');
    store.register({
        id:    'mahendra.demo.coins20',
        alias: '20 Coins',
        type:   store.CONSUMABLE
    });

    store.register({
        id:    'mahendra.demo.nonconsumable',
        alias: 'Premium Version',
        type:   store.NON_CONSUMABLE
    });

    store.register({
        id:    'mahendra.demo.subscription',
        alias: 'subscription',
        type:  store.PAID_SUBSCRIPTION
    });

    // When any product gets updated, refresh the HTML.
    store.when("product").updated(function (p) {
        app.renderIAP(p);
    });

    store.when("subscription").approved(function(p) {
        log("verify subscription");
        p.verify();
    });
    store.when("subscription").verified(function(p) {
        log("subscription verified");
        p.finish();
    });
    store.when("subscription").unverified(function(p) {
        log("subscription unverified");
    });
    store.when("subscription").updated(function(p) {
        if (p.owned) {
            document.getElementById('subscriber-info').innerHTML = 'You are a lucky subscriber!';
        }
        else {
            document.getElementById('subscriber-info').innerHTML = 'You are not subscribed';
        }
    });

    // Log all errors
    store.error(function(error) {
        log('ERROR ' + error.code + ': ' + error.message);
    });

    // When purchase of an 20 Coins is approved,
    // deliver it... by displaying logs in the console.
    store.when("20 Coins").approved(function (order) {
        log("You got 20 Coins!");
        order.finish();
    });

    // When purchase of the Premium Version is approved,
    // show some logs and finish the transaction.
    store.when("Premium Version").approved(function (order) {
        log('You just unlocked the Premium Version!');
        order.finish();
    });

    // The play button can only be accessed when the user
    // owns the Premium Version.
    store.when("Premium Version").updated(function (product) {
        document.getElementById("access-full-version-button").style.display =
            product.owned ? "block" : "none";
    });

    // When the store is ready (i.e. all products are loaded and in their "final"
    // state), we hide the "loading" indicator.
    //
    // Note that the "ready" function will be called immediately if the store
    // is already ready.
    store.ready(function() {
        var el = document.getElementById("loading-indicator");
        if (el)
            el.style.display = 'none';
    });

    // When store is ready, activate the "refresh" button;
    store.ready(function() {
        var el = document.getElementById('refresh-button');
        if (el) {
            el.style.display = 'block';
            el.onclick = function(ev) {
                store.refresh();
            };
        }
    });

    // Alternatively, it's technically feasible to have a button that
    // is always visible, but shows an alert if the Premium Version isn't
    // owned.
    // ... but your app may be rejected by Apple if you do it this way.
    //
    // Here is the pseudo code for illustration purpose.

    // myButton.onclick = function() {
    //   store.ready(function() {
    //     if (store.get("Premium Version").owned) {
    //       // access the awesome feature
    //     }
    //     else {
    //       // display an alert
    //     }
    //   });
    // };


    // Refresh the store.
    //
    // This will contact the server to check all registered products
    // validity and ownership status.
    //
    // It's fine to do this only at application startup, as it could be
    // pretty expensive.
    log('refresh');
    store.refresh();
};

app.renderIAP = function(p) {
    console.log("p: " + JSON.stringify(p));

    var elId = p.id.split(".")[2];
    //console.log("elId: " + elId);

    var el = document.getElementById(elId + '-purchase');
    if (!el) return;

    if (!p.loaded) {
        el.innerHTML = '<h3>...</h3>';
    }
    else if (!p.valid) {
        el.innerHTML = '<h3>' + p.alias + ' Invalid</h3>';
    }
    else if (p.valid) {
        var html = "<h3>" + p.title + "</h3>" + "<p>" + p.description + "</p>";
        if (p.canPurchase) {
            html += "<div class='button' id='buy-" + p.id + "' productId='" + p.id + "' type='button'>" + p.price + "</div>";
        }
        el.innerHTML = html;
        if (p.canPurchase) {
            document.getElementById("buy-" + p.id).onclick = function (event) {
                var pid = this.getAttribute("productId");
                store.order(pid);
            };
        }
    }
};

// 
// Utilities
// ---------
//

// shortcut to the app logging function.
function log(arg) { app.log(arg); }

// log both in the console and in the HTML #log element.
app.log = function(arg) {
    try {
        if (typeof arg !== 'string')
            arg = JSON.stringify(arg);
        console.log(arg);
        document.getElementById('log').innerHTML += '<div>' + arg + '</div>';
    } catch (e) {}
};

// make sure fn will be called with app as 'this'
app.bind = function(fn) {
    return function() {
        fn.call(app, arguments);
    };
};

app.initialize();