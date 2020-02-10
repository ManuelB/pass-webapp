sap.ui.define(['sap/ui/model/json/JSONTreeBinding'],
    function(JSONTreeBinding) {
        "use strict";
        var BitbucketTreeBinding = JSONTreeBinding.extend("pass.manager.model.BitbucketTreeBinding");

        BitbucketTreeBinding.prototype.getNodeContexts = function(oContext, iStartIndex, iLength) {
            this.oModel.loadDataIfNecessary(oContext, (oJson) => {
                this.fireDataReceived({ data: oJson });
            });
            return JSONTreeBinding.prototype.getNodeContexts.apply(this, arguments);
        };

        /**
         * Retrieves the number of children for the given context.
         * Makes sure the child count is retrieved from the length cache, and fills the cache if necessary.
         * Calling it with no arguments or 'null' returns the number of root level nodes.
         *
         * @param {sap.ui.model.Context} oContext the context for which the child count should be retrieved
         * @return {int} the number of children for the given context
         * @public
         * @override
         */
        BitbucketTreeBinding.prototype.getChildCount = function(oContext) {
            //if oContext is null or empty -> root level count is requested
            var sPath = oContext ? oContext.sPath : this.getPath();

            if (this.oContext) {
                sPath = this.oModel.resolve(sPath, this.oContext);
            }
            sPath = this._sanitizePath(sPath);

            // if the length is not cached, call the get*Contexts functions to fill it
            if (this._mLengthsCache[sPath] === undefined) {
                if (oContext) {
                    this.getNodeContexts(oContext);
                } else {
                    this.getRootContexts();
                }
            }

            return this._mLengthsCache[sPath];
        };

        return BitbucketTreeBinding;
    });