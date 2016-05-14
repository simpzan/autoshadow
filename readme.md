# autoshadow

## problem
you have several shadowsocks(ss for short) accounts, some is usable and some is unusable. you want to find a usable one and use it for your proxy. 

## solution
autoshadow is just made to solve this problem. it uses each ss account to test the connection to google server, and find the first one pass the test.

## how it works
run a ss instance with a ss account as a socket proxy, and run polipo to convert socket proxy to http proxy. then use http client library to make request to google server. if request returns ok within 1s, then this ss account is usable. otherwise it is unusable, and try next ss account.

## dependencies
- a shadowsock client, I use the original python version.
- a socket proxy to http proxy converter, I use polipo. installed via `brew install polipo`
- electron.js, this is used to implement the ui for this tool. 

## components of this tool 
- the core logic in autoshadow dir.
- the ui in desktop dir. the ui is just a system tray icon, and a menu when clicking it.

## the menu and features
- status: the current configed ss account
- refresh: try to find the next usable ss account, and apply it as config.
- servers: a list of ss accounts
- import: import the accounts json file exported from fyzhuji. 
- exit: quit the tool

## ss service provider
www.fyzhuji.com

## todo
- open dialog foreground.
- manually input server config.
- performance improvement and code clean up
- install script for mac.
    + download shadowsocks.py
    + install polipo
- settings
    + local ports
    + ss filepath
