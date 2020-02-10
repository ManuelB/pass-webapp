sap.ui.define(["./BitbucketTreeBinding", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment", "sap/base/Log"],
    function(BitbucketTreeBinding, JSONModel, Fragment, Log) {
        "use strict";

        var Bitbucket = JSONModel.extend("pass.manager.model.Bitbucket", {
            "constructor": function() {
                JSONModel.apply(this, arguments);
                if (window.localStorage.getItem("BitBucket") === null) {
                    this.requestConfig();
                } else {
                    this.loadConfig();
                }

            }

        });
        Bitbucket.prototype.requestConfig = function(fnCallback) {
            Fragment.load({
                name: "pass.manager.model.ConfigureBitbucket",
                controller: this
            }).then((oDialog) => {
                oDialog.setModel(new JSONModel());
                oDialog.open();
                this.oDialog = oDialog;
            });
        };

        Bitbucket.prototype.onSave = function() {
            this.oDialog.close();
            window.localStorage.setItem("BitBucket", JSON.stringify(this.oDialog.getModel().getData()));
            this.loadConfig();
        };

        Bitbucket.prototype.loadConfig = function() {
            let oData = JSON.parse(window.localStorage.getItem("BitBucket"));
            this.sBaseUrl = oData.baseUrl;
            this.sUsername = oData.username;
            this.sPassword = oData.password;

            this.initModel();
        };

        Bitbucket.prototype.initModel = function() {
            this._mPathLoaded = {};

            fetch(this.sBaseUrl, {
                "headers": { "Authorization": "Basic " + btoa(this.sUsername + ":" + this.sPassword) }
            }).then((o) => o.json()).then((oJson) => {
                this.setData(oJson);
            });
        };

        Bitbucket.prototype.loadFile = function(oContext) {
            let sLink = oContext.getProperty("links/self/href");
            return fetch(sLink, {
                "headers": { "Authorization": "Basic " + btoa(this.sUsername + ":" + this.sPassword) }
            }).then((o) => o.arrayBuffer());
        };

        Bitbucket.prototype.loadDataIfNecessary = function(oContext, fnDataReceived) {
            if (oContext.getPath() != "/values" && this.isDirectory(oContext.getPath()) && !this._mPathLoaded[oContext.getPath()]) {
                let sRepositoryUrl = this.sBaseUrl + this.repositoryPathFromContext(oContext.getPath());
                fetch(sRepositoryUrl, {
                    "headers": { "Authorization": "Basic " + btoa(this.sUsername + ":" + this.sPassword) }
                }).then((o) => o.json()).then((oJson) => {
                    if (!oJson) {
                        Log.warn("Did not receive valid data from: " + sRepositoryUrl);
                        return;
                    }
                    this.setProperty(oContext.getPath() + "/values", oJson.values);
                    this.bNeedsUpdate = true;
                    fnDataReceived(oJson);
                });
                this._mPathLoaded[oContext.getPath()] = true;
            }
        };

        Bitbucket.prototype.isDirectory = function(sPath) {
            return this.getProperty(sPath + "/type") === "commit_directory";
        };

        Bitbucket.prototype.repositoryPathFromContext = function(sPath) {
            let aParts = sPath.split(/\/values\//).filter((s) => s !== "");
            let aFileNames = [];
            let oCurrentNode = this.getData();
            let iChild;
            while (iChild = aParts.shift()) {
                aFileNames.push(oCurrentNode.values[iChild].path);
                oCurrentNode = oCurrentNode.values[iChild];
            }
            return aFileNames.join("/");
        };

        /**
         * @see sap.ui.model.Model.prototype.bindTree
         *
         * @param {object}
         *         [mParameters=null] additional model specific parameters (optional)
         *         If the mParameter <code>arrayNames</code> is specified with an array of string names this names will be checked against the tree data structure
         *         and the found data in this array is included in the tree but only if also the parent array is included.
         *         If this parameter is not specified then all found arrays in the data structure are bound.
         *         If the tree data structure doesn't contain an array you don't have to specify this parameter.
         *
         */
        Bitbucket.prototype.bindTree = function(sPath, oContext, aFilters, mParameters, aSorters) {
            var oBinding = new BitbucketTreeBinding(this, sPath, oContext, aFilters, mParameters, aSorters);
            return oBinding;
        };

        return Bitbucket;
    });