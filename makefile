all:
	cd desktop; npm install electron-packager -g; npm run package

clean:
	rm -rf autoshadow/node_modules autoshadow/shadowsocks desktop/node_modules
