sap.ui.define(["sap/ui/model/json/JSONModel", "pass/thirdparty/openpgp.min", "sap/ui/core/Fragment", "sap/base/Log"],

    function(JSONModel, openpgpUndefined, Fragment, Log) {
        "use strict";
        // wget https://raw.githubusercontent.com/openpgpjs/openpgpjs/v4.9.0/dist/openpgp.min.js
        // wget https://raw.githubusercontent.com/openpgpjs/openpgpjs/v4.9.0/dist/openpgp.js
        // wget https://raw.githubusercontent.com/openpgpjs/openpgpjs/v4.9.0/dist/openpgp.worker.js
        // wget https://raw.githubusercontent.com/openpgpjs/openpgpjs/v4.9.0/dist/openpgp.worker.min.js

        var OpenPGP = JSONModel.extend("pass.manager.model.OpenPGP", {
            "constructor": function() {
                JSONModel.apply(this, arguments);
                this.setData({
                    "name": "",
                    "email": "",
                    "passphrase": "",
                    "OpenPGPKeyPair": { "publicKeyArmored": "", "privateKeyArmored": "", "revocationCertificate": "" }
                });
                // The OpenPGP class should only initialized once 
                // set the relative web worker path
                openpgp.initWorker({ path: sap.ui.require.toUrl("pass/thirdparty") + '/openpgp.worker.js' }).then(() => {
                    if (window.localStorage.getItem("OpenPGP") === null) {
                        this.requestKeyPair(() => this.loadKeyPair());
                    } else {
                        this.loadKeyPair();
                    }
                });
            },
            "requestKeyPair": function(fnCallback) {
                Fragment.load({
                    name: "pass.manager.model.ImportOrCreateKeyPair",
                    controller: this
                }).then((oDialog) => {
                    oDialog.setModel(this);
                    oDialog.open();
                    this.oDialog = oDialog;
                });
            },
            "onNewKey": function() {
                openpgp.generateKey({
                    userIds: [this.getData()], // you can pass multiple user IDs
                    rsaBits: 4096, // ECC curve name
                    passphrase: this.getProperty("/passphrase") // protects the private key
                }).then((oRsaKey) => {
                    this.setProperty("/OpenPGPKeyPair/publicKeyArmored", oRsaKey.publicKeyArmored);
                    this.setProperty("/OpenPGPKeyPair/privateKeyArmored", oRsaKey.privateKeyArmored);
                    this.setProperty("/OpenPGPKeyPair/revocationCertificate", oRsaKey.revocationCertificate);

                    var hkp = new openpgp.HKP('https://keys.openpgp.org/');

                    hkp.upload(oRsaKey.publicKeyArmored).then(() => {
                        this.oDialog.close();
                    });

                });
            },
            "onSave": function() {
                this.oDialog.close();
                window.localStorage.setItem("OpenPGP", JSON.stringify(this.getData()));
            },
            "loadKeyPair": function() {
                this.setData(JSON.parse(window.localStorage.getItem("OpenPGP")));
            },
            "destroy": function() {
                openpgp.destroyWorker().then(() => {
                    JSONModel.prototype.destroy.apply(this, arguments);
                });
            }
        });
        return OpenPGP;
    });