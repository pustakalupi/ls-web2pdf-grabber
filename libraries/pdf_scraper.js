const Nightmare = require('nightmare');
var fs = require('fs');

function PDFScraper () {
    this.proxyIsBeingUsed = false;
    this.proxyNeedAuth = false;
    this.forceStopScrapers = false;
}

PDFScraper.prototype.setOnScrapeStartedCallback = function (onScrapeStartedCallback) {
    this.onScrapeStartedCallback = onScrapeStartedCallback;
}

PDFScraper.prototype.setOnScrapeStoppedCallback = function (onScrapeStoppedCallback) {
    this.onScrapeStoppedCallback = onScrapeStoppedCallback;
}

PDFScraper.prototype.setOnScrapeProgressCallback = function (onScrapeProgressCallback) {
    this.onScrapeProgressCallback = onScrapeProgressCallback;
}

PDFScraper.prototype.setOnScrapeNonHTMLFoundCallback = function (onScrapeNonHTMLFoundCallback) {
    this.onScrapeNonHTMLFoundCallback = onScrapeNonHTMLFoundCallback;
}

PDFScraper.prototype.setOnScrapeOneDownloadFinishedCallback = function (onScrapeOneDownloadFinishedCallback) {
    this.onScrapeOneDownloadFinishedCallback = onScrapeOneDownloadFinishedCallback;
}

PDFScraper.prototype.setOnScrapeErrorCallback = function (onScrapeErrorCallback) {
    this.onScrapeErrorCallback = onScrapeErrorCallback;
}

PDFScraper.prototype.setScrapeArgs = function (scrapeArgs) {
    this.rootURL = scrapeArgs.rootURL;
    this.excludeURLContains = scrapeArgs.excludeURLContains;
    this.downloadLimit = scrapeArgs.downloadLimit;
    this.proxyIP = scrapeArgs.proxyIP;
    this.proxyPort = scrapeArgs.proxyPort;
    this.ignoreCertErr = scrapeArgs.ignoreCertErr;
    this.proxyUser = scrapeArgs.proxyUser;
    this.proxyPass = scrapeArgs.proxyPass;
    this.userAgent = scrapeArgs.userAgent;
    this.outputPath = scrapeArgs.outputPath;
    this.whenDownloadFinished = scrapeArgs.whenDownloadFinished;

    console.log(this.excludeURLContains == undefined);
    this.excludeURLContains.split(",")
}

PDFScraper.prototype.start = function () {
    console.log("PDF scraper is started");

    if(this.areArgsValid()){
        console.log("make output directory");

        try{
            fs.mkdirSync(this.outputPath + "\\" + "Web2PDFGrabber");
        } catch (err){

        }

        console.log("make output sub directory");

        var outputPathFolderName = 
        this.outputPath + "\\" + "Web2PDFGrabber" + "\\" + 
        PDFScraper.extractHostname(this.rootURL) + "-" + PDFScraper.uniqueID();
        
        try {
            fs.mkdirSync(outputPathFolderName);
        } catch (err) {
        }

        console.log("begins to scrape...");
        var leftList = Array();
        var leftListCtr = -1;
        var nightmare;
        if(this.proxyIsBeingUsed){
            console.log("using proxy");

            nightmare = Nightmare({ 
                electronPath: require('../node_modules/electron'),
                show: false,
                switches: {
                    'proxy-server': this.proxyIP + ':' + this.proxyPort, //my_proxy_server.example.com:8080'
                    'ignore-certificate-errors': this.ignoreCertErr
                }
            });

            if(this.proxyNeedAuth){
                nightmare.authentication(this.proxyUser, this.proxyPass);
            }
        } else {
            nightmare = Nightmare({ 
                electronPath: require('../node_modules/electron'),
                show: false
            });
        }

        if(this.userAgentIsUsed){
            nightmare.useragent(this.userAgent);
        }

        this.doScraping(
            nightmare, this.rootURL, this.rootURL, outputPathFolderName, leftList, leftListCtr);
    } else {
        console.log("invalide scrape args");
    }
}

PDFScraper.prototype.stop = function () {
    console.log("PDF scraper is stopped");
    this.forceStopScrapers = true;
}

PDFScraper.prototype.doScraping = function (nobj, urlTarget, comparator, out, leftList, leftListCtr1) {

    if(this.onScrapeStartedCallback){
        this.onScrapeStartedCallback();
    }

    if(leftListCtr1 >= leftList.length){
        console.log("scraping process is done, exit code: 0");
        console.log(urlTarget);

        if(this.onScrapeStoppedCallback){
            this.onScrapeStoppedCallback('done');
        }

        this.whenScrapingFinished();

        nobj.end();
        return;
    }

    leftListCtr1++;

    if(this.downloadLimit != -1 && leftListCtr1 >= this.downloadLimit){
        console.log("download limit has been reached");
        console.log("scraping process is done, exit code: 1");

        if(this.onScrapeStoppedCallback){
            this.onScrapeStoppedCallback('done');
        }

        this.whenScrapingFinished();

        nobj.end();
        return;
    }

    if(this.forceStopScrapers == true){
        console.log("scraping process has been stopped forcefully");
        console.log("scraping process is done, exit code: 2");

        if(this.onScrapeStoppedCallback){
            this.onScrapeStoppedCallback('force');
        }

        this.whenScrapingFinished();

        nobj.end();
        return;
    }


    if(this.onScrapeProgressCallback){
        var prog = this.downloadLimit == -1 ? (leftListCtr1/leftList.length) * 100 : (leftListCtr1/Math.min(leftList.length, this.downloadLimit -1)) * 100;
        this.onScrapeProgressCallback(prog);
    }
    
    var self = this;
    require('request')(urlTarget, function (error, response, body) {
        if(response.headers["content-type"].search("text/html") == -1){
            console.log("non text/html found...");

            if(self.onScrapeNonHTMLFoundCallback){
                self.onScrapeNonHTMLFoundCallback();
            }

            self.doScraping(nobj, leftList[leftListCtr1], comparator, out, leftList, leftListCtr1);
            return;
        }
        nobj
        .goto(urlTarget)
        .wait()
        .pdf(out + "\\" + (leftListCtr1).toString() + "-" + urlTarget.replace(/\\|\/|\*|\?|\<|\>|\||:/g,'-') + ".pdf")
        .evaluate(function () {
            var hrefs = Array();
            var qsa = document.querySelectorAll('a');
            for(var i = 0; i < qsa.length; i++){
                hrefs.push(qsa[i].href);
            }
            return {title: document.title, theHREFS: hrefs};
        })
        .then(function (results) {
            for(var i = 0; i < results.theHREFS.length; i++){
                var len = leftList.filter(x => x.includes(results.theHREFS[i])).length;
                var len1 = results.theHREFS[i].search(comparator);
                var splitted = self.excludeURLContains.split(",");
                var containsJunks = true;
                var jCtr = 0;

                if(self.excludeURLContains){
                    for(var j = 0; j < splitted.length; j++){
                        var len2 = results.theHREFS[i].search(splitted[j]);
                        if(len2 != -1){
                            console.log("junk: " + splitted.length + " => " + results.theHREFS[i]);
                            jCtr++;
                        }
                    }
                }
                
                containsJunks = (jCtr != 0);

                if(len == 0 && len1 == 0 && containsJunks == false && results.theHREFS[i] != comparator){
                    leftList.push(results.theHREFS[i]);
                }
            }

            console.log(urlTarget);
            if(self.onScrapeOneDownloadFinishedCallback){
                self.onScrapeOneDownloadFinishedCallback(urlTarget);
            }

            self.doScraping(nobj, leftList[leftListCtr1], comparator, out, leftList, leftListCtr1);
        })
        .catch(function (error) {
            console.log(error);
            if(self.onScrapeErrorCallback){
                self.onScrapeErrorCallback(error);
            }
        });
    });
}

PDFScraper.prototype.areArgsValid = function () {
    var valid = false;
    var valid1 = false;
    var valid2 = false;
    var valid3 = false;

    valid = this.rootURL != null && this.rootURL != "" && this.rootURL != undefined;
    valid1 = this.isOutputFolderFine() && this.outputPath != null && this.outputPath != "" && this.outputPath != undefined;
    
    if(
        this.proxyIP != null && 
        this.proxyIP != "" &&
        this.proxyIP != undefined &&
        this.proxyPort != null &&
        this.proxyPort != "" &&
        this.proxyPort != undefined
    ){
        console.log("valid2 true");
        valid2 = true;
    }

    valid3 = valid2 ? isProxyFine() : true;

    this.proxyIsBeingUsed = valid2 && isProxyFine();
    this.proxyNeedAuth = 
    this.proxyUser != null && this.proxyUser != "" && this.proxyUser != undefined &&
    this.proxyPass != null && this.proxyPass != "" && this.proxyPass != undefined;

    this.userAgentIsUsed = 
    this.userAgent != null && this.userAgent != "" && this.userAgent != undefined;

    return valid && valid1 && valid3;
}

PDFScraper.prototype.isProxyFine = function () {
    return true;
}

PDFScraper.prototype.isOutputFolderFine = function () {
    return fs.existsSync(this.outputPath);
}

PDFScraper.prototype.whenScrapingFinished = function () {
    if(this.whenDownloadFinished == "open-output-folder"){
        console.log("opening output folder");
        var targetfolder = this.outputPath + "\\Web2PDFGrabber";
        require('electron').shell.showItemInFolder(targetfolder);
    } else if(this.whenDownloadFinished == "do-nothing"){
        console.log("do nothing happily");
    }
}

PDFScraper.extractHostname = function(url) {
    return require('url').parse(url).hostname;
}

PDFScraper.uniqueID = function(){
    return (new Date().getUTCMilliseconds()).toString();
}

module.exports = PDFScraper;