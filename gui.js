/*
	pdumpvergelijken - vergelijk pdump bestanden
    Copyright (C) 2022, 2024 Gemeente Den Haag, Netherlands
    Developed by Jasper Vries
 
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
* document ready
*/
$(function() {
    /*
    * init dialogs
    */
    $('#fileinputdialog').dialog({
        autoOpen: false,
        buttons: [
            {
                text: "OK",
                click: function() {
                    loadFileContentsHandle(active_type);
                    $(this).dialog('close');
                }
            },
            {
                text: "Annuleren",
                click: function() {
                    active_type = null;
                    document.getElementById('input').value = '';
                    $(this).dialog('close');
                }
            }
        ],
        modal: true,
        width: 800
    });
    $('#helpdialog').dialog({
        autoOpen: false,
        buttons: [
            {
                text: "Sluiten",
                click: function() {
                    $(this).dialog('close');
                }
            }
        ],
        title: 'Help',
        width: Math.min(800, window.innerWidth),
        maxHeight: window.innerHeight
    });
    /*
    * init buttons
    */
    $('#menu-new').button();
    $('#menu-open').button();
    $('#menu-import-old').button();
    $('#menu-import-new').button();
    $('#menu-saveas').button();
    $('#menu-help').button();
    setFirstRun();
    /*
    * button onclick handles
    */
    $('#menu-new').click(function() {
        let prompt = confirm('Alle ingeladen informatie en toegevoegde opmerkingen worden gewist. Doorgaan?');
        if (prompt == true) {
            newButtonClickHandle();
            setFirstRun();
        }
    });
    $('#menu-open').click(function() {
        openImportDialog('open');
    });
    $('#menu-import-old').click(function() {
        openImportDialog('old');
    });
    $('#menu-import-new').click(function() {
        openImportDialog('new');
    });
    $('#menu-saveas').click(function() {
        saveAsButtonClickHandle();
    });
    $('#menu-help').click(function() {
        openHelpDialog();
    });
    //hide loading screen
    setLoadingScreen(null);
});

/*
* handle import dialog
*/
function openImportDialog(type) {
    document.getElementById('input').value = '';
    active_type = type;
    var title;
    if (type == 'open') {
        title = 'Open opgeslagen json-bestand';
        $('input#file').attr('accept', '.json,text/json');
    }
    else if (type == 'old') {
        title = 'Importeer oud pdump bestand';
        $('input#file').attr('accept', '.txt,.c,text/plain');
    }
    else if (type == 'new') {
        title = 'Importeer nieuw pdump bestand';
        $('input#file').attr('accept', '.txt,.c,text/plain');
    }
    $('#fileinputdialog').dialog('option', 'title', title);
    $('#fileinputdialog').dialog('open');
}

 /*
 * loading screen
 */
function setLoadingScreen(text = null) {
    //hide loading screen
    if (text == null) {
        $('#loadingscreencontainer').hide();
    }
    else {
        $('#loadingscreencontainer').show();
        $('#loadingscreencontainer span').text(text);
    }
    //console.log('loading screen ' + text);
}

/*
* help dialog
*/
function openHelpDialog()  {
    $('#helpdialog').dialog('open');
}

/*
* prevent accidental closing of page
*/
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    //e.returnValue = '';
});