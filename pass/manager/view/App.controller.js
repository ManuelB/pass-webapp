sap.ui.define(["sap/ui/core/mvc/Controller"], function(Controller) {
    "use strict";

    return Controller.extend("pass.manager.view.App", {

        onInit: function() {},
        onFileSelect: function(oEvent) {
            let oBindingContext = oEvent.getSource().getBindingContext("Bitbucket");
            if (oBindingContext.getProperty("type") === "commit_file") {
                this.getView().getModel("Bitbucket").loadFile(oEvent.getSource().getBindingContext("Bitbucket")).then((oArrayBuffer) => {
                    if (oBindingContext.getProperty("path").endsWith(".gpg")) {
                        this.getView().getModel("OpenPGP").decrypt(new Uint8Array(oArrayBuffer)).then((sPasswords) => this.byId("code").setValue(sPasswords));
                    } else {
                        let sPasswords = String.fromCharCode.apply(null, new Uint8Array(oArrayBuffer));
                        this.byId("code").setValue(sPasswords);
                    }
                });
            }
        }
    });
});