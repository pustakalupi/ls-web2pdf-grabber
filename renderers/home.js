const {ipcRenderer} = require('electron');

$( document ).ready(function() {

    $("#btn-start").click(function(){
        if ($(this).text() == "Start") { 
            
            var scrapeArgs = {
                rootURL: $('#txt-single-url').val(),
                excludeURLContains: $('#txt-exclude-url-contains').val(),
                downloadLimit: parseInt($('#txt-download-limit').val(), 10),
                proxyIP: $('#txt-ip-address').val(),
                proxyPort: $('#txt-port').val(),
                ignoreCertErr: $('#chk-ignore-cert-err').is(':checked'),
                proxyUser: $('#txt-username').val(),
                proxyPass: $('#pass-password').val(),
                userAgent: $('#txt-user-agent').val(),
                outputPath: $('#browse-result').val(),
                whenDownloadFinished: $('input[name=rad-when-finished]:checked').val()
            };
    
            ipcRenderer.send('start-scraping', scrapeArgs, () => {
                console.log("Event sent.");
            });
        } else if ($(this).text() == "Stop") { 

            ipcRenderer.send('stop-scraping', scrapeArgs, () => {
                console.log("Event sent.");
            });
        };
    });

    $("#browse").click(function(){
        if($("#btn-start").hasClass( "disabled" ) == true){
            return;
        }

        ipcRenderer.send('open-file', () => {
            console.log("Event sent.");
        });
    });

    ipcRenderer.on('set-directory-path', (event, arg) => {
        $("#browse-result").val(arg);
    });

    ipcRenderer.on('set-progress', (event, arg) => {
        $("#progressbar").css('width', arg + '%');
    });

    ipcRenderer.on('toggle-start-button', (event, arg) => {
        if(arg == true){
            //$("#btn-start").addClass('disabled');
            $("#btn-start").text("Stop");

            $("#txt-single-url").addClass('disabled');
            $("#txt-exclude-url-contains").addClass('disabled');
            $("#txt-download-limit").addClass('disabled');
            $("#txt-ip-address").addClass('disabled');
            $("#txt-port").addClass('disabled');
            $("#chk-ignore-cert-err").addClass('disabled');
            $("#txt-username").addClass('disabled');
            $("#pass-password").addClass('disabled');
            $("#txt-user-agent").addClass('disabled');
            $("#browse-result").addClass('disabled');
            $("input[name=rad-when-finished]").addClass('disabled');
            $("input[type=radio][name=rad-url-type]").addClass('disabled');
        }else{
            //$("#btn-start").removeClass('disabled');
            $("#btn-start").text("Start");

            $("#txt-single-url").removeClass('disabled');
            $("#txt-exclude-url-contains").removeClass('disabled');
            $("#txt-download-limit").removeClass('disabled');
            $("#txt-ip-address").removeClass('disabled');
            $("#txt-port").removeClass('disabled');
            $("#chk-ignore-cert-err").removeClass('disabled');
            $("#txt-username").removeClass('disabled');
            $("#pass-password").removeClass('disabled');
            $("#txt-user-agent").removeClass('disabled');
            $("#browse-result").removeClass('disabled');
            $("input[name=rad-when-finished]").removeClass('disabled');
            $("input[type=radio][name=rad-url-type]").removeClass('disabled');
        }

        $("#txt-single-url").prop('disabled', arg);
        $("#txt-exclude-url-contains").prop('disabled', arg);
        $("#txt-download-limit").prop('disabled', arg);
        $("#txt-ip-address").prop('disabled', arg);
        $("#txt-port").prop('disabled', arg);
        $("#chk-ignore-cert-err").prop('disabled', arg);
        $("#txt-username").prop('disabled', arg);
        $("#pass-password").prop('disabled', arg);
        $("#txt-user-agent").prop('disabled', arg);
        $("#browse-result").prop('disabled', arg);
        $("input[name=rad-when-finished]").prop('disabled', arg);
        $("input[type=radio][name=rad-url-type]").prop('disabled', arg);
    });
});