sap.ui.define([
	"sap/ui/core/Component",
	"sap/m/Button",
	"sap/m/Bar",
	"sap/m/MessageToast"
], function(Component, Button, Bar, MessageToast) {

	return Component.extend("com.pd.flp.ext.Component", {

		metadata: {
			"manifest": "json"
		},

		init: function() {

			var appLifeCycle = sap.ushell.Container.getService("AppLifeCycle");
			var currentApp = appLifeCycle.getCurrentApplication();
			if (currentApp != undefined) { //This app is getting called directly using URL, without clicking on the Tile
				if (!currentApp.homePage) {
					var currentComponentID = currentApp.componentInstance.getId();
					currentComponentID = currentComponentID.replace("application-", "");
					currentComponentID = currentComponentID.replace("-component", "");
					var currentHash = location.hash;
					//Send details to server
					this.getModel().create("/Actions", {
						"ComponentID": currentComponentID,
						"CompleteHash": currentHash
					});
				}
			}

			appLifeCycle.attachAppLoaded(null,
				function(oData,
					oEvent) {
					currentApp = appLifeCycle.getCurrentApplication();
					if (currentApp.homePage || location.hash === "#Shell-home") { //Navigated to FIori Launhcpad after directly opening a Fiori app using a bookmarked URL
						if (!this.hasOwnProperty("allGroups")) {
							var that = this; //For passing the context using closure
							var timeout = setInterval( //Wait for the Groups to load
								function() {
									if (sap.ui.getCore().byId("dashboardGroups").getGroups().length > 0) {
										clearInterval(timeout);
										var allGroups = sap.ui.getCore().byId("dashboardGroups").getGroups();
										this.allGroups = allGroups;
										for (var i = 0; i < allGroups.length; i++) {
											var groupTiles = allGroups[i].getTiles();
											for (var j = 0; j < groupTiles.length; j++) {
												groupTiles[j].addEventDelegate({
													ontap: function(evt) {
														var appName = this.tile.getBindingContext().getObject().object.getTitle();
														this.oModel.create("/Actions", {
															"ApplicationName": appName
														});
													}
												}, {
													"oModel": that.getModel(),
													"tile": groupTiles[j]
												});
											}
										}
									}
								}, 100); //Check that Tiles/Groups are loaded. Only then you can set click-listener on Tiles
						}
					}
				},
				this);
				
			var allGroups = sap.ui.getCore().byId("dashboardGroups").getGroups();
			this.allGroups = allGroups;
			for (var i = 0; i < allGroups.length; i++) {
				var groupTiles = allGroups[i].getTiles();
				for (var j = 0; j < groupTiles.length; j++) {
					groupTiles[j].addEventDelegate({
						ontap: function(evt) {
							var appName = this.tile.getBindingContext().getObject().object.getTitle();
							this.oModel.create("/Actions", {
								"ApplicationName": appName
							});
						}
					}, {
						"oModel": this.getModel(),
						"tile": groupTiles[j]
					});
				}
			}
		},
		/**
		 * Returns the shell renderer instance in a reliable way,
		 * i.e. independent from the initialization time of the plug-in.
		 * This means that the current renderer is returned immediately, if it
		 * is already created (plug-in is loaded after renderer creation) or it
		 * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
		 * before the renderer is created).
		 *
		 *  @returns {object}
		 *      a jQuery promise, resolved with the renderer instance, or
		 *      rejected with an error message.
		 */
		_getRenderer: function() {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function(oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		}
	});
});