const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');


app.on("window-all-closed", function() {
	app.quit();
});

var mainWindow = null;
var resultWindow = null;
const { dialog } = require('electron');


app.on("ready", function() {
	mainWindow = new BrowserWindow({
		width: 700,
		height: 400,
		center: true,
		resizable: false,
		frame: true,
		nodeIntegration: true,
		contextIsolation: false, // Also important for the preload script to have effect.
		enableRemoteModule: true, // If you're using the `remote` module.
	});

	mainWindow.setMenu(null);
	var homepageUrl = `file://${__dirname}/index.html`;
	mainWindow.loadURL(homepageUrl);
	mainWindow.openDevTools();


	ipcMain.on("sameField", function(evt, args) {

		if (!resultWindow) {
			resultWindow = new BrowserWindow({
				width: 1050,
				height: 600,
				resizable: false,
				nodeIntegration: true,
				contextIsolation: false, // Also important for the preload script to have effect.
				enableRemoteModule: true, // If you're using the `remote` module.
			});
		}

		var samefields = args.data;

		resultWindow.webContents.on("did-finish-load", function() {
			resultWindow.webContents.send("sameField", {
				data: samefields
			});
		});

		resultWindow.loadUrl("file://" + __dirname + "/result.html");
		// resultWindow.openDevTools();

		resultWindow.on("closed", function() {
			console.log("resultWindow has been closed.");
			resultWindow = null;
		});
	});

	ipcMain.on("compareRequest", function(evt, args) {
		mainWindow.webContents.send("compareRequest", {
			data: args.data
		});
	});

	ipcMain.on("buildHash", function(evt, args) {
		console.log("buildHash " + args.data);
	});

	ipcMain.on("compareAction", function(evt, args) {
		resultWindow.webContents.send("progress", {
			data: args.data
		});
	});

	ipcMain.on("exportImage", function(evt, args) {
		resultWindow.capturePage(function(image){
			var fs = require("fs");

			dialog.showSaveDialog(
				resultWindow,
				{
					title: "Export to PNG",
			    filters: [{
			       name: "screenshot.png",
			       extensions: ["png"]
			    }]
				},
				function(pathname) {
					if (!pathname) return;
					fs.writeFileSync(pathname, image.toPng());
				}
			);
		});
	});

	ipcMain.on("diffRecords", function(evt, args) {
		var diffRecords = args.data;
		var targetFields = args.fields;

		resultWindow.webContents.send("diffRecords", {
			data: diffRecords,
			fields: targetFields
		});

	});

	var closeWindowHandler = function(e) {
		e.preventDefault();
		dialog.showMessageBox(
			mainWindow,
			{
				type: "warning",
				title: "Close window",
				message: "Do you want to close the window?",
				buttons: ["Yes", "No"]
			},
			function(response) {
				if (response == 0) {
					if (resultWindow) {
						resultWindow.close();
					}
					mainWindow.removeListener("close", closeWindowHandler);
					setTimeout(mainWindow.close.bind(mainWindow), 0);
				}
			}
		);
	};
	mainWindow.on("close", closeWindowHandler);


	mainWindow.on("closed", function() {
		mainWindow = null;
		resultWindow = null;
	});
});
