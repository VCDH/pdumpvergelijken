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

var table = [];
var file_read = [];
file_read['old'] = false;
file_read['new'] = false;

function loadFileContentsHandle(type) {
    var file = document.getElementById('input').value;
    if (type == 'open') {
        setLoadingScreen('Bestand openen...');
        setTimeout(function() { 
            var res = loadSavedFile(file); 
            if (res) {
                setTimeout(function() { setRowClasses(); }, 200);
            }
            else {
                alert('Kan bestand niet openen. Ongeldig bestandsformaat.');
            }
            setTimeout(function() { setLoadingScreen(null); }, 300)
        }, 1);
        
    }
    else if ((type == 'old') || (type == 'new')) {
        setLoadingScreen('Gegevens inlezen...');
        setTimeout(function() { read_pdump(type, file); }, 3);
        setTimeout(function() { setLoadingScreen(null); }, 4);
    }
    setFirstRun(false);
}

function saveAsButtonClickHandle() {
    download_file(JSON.stringify(table), 'pdumpvergelijking.pdv')
}

function newButtonClickHandle() {
    file_read['old'] = false;
    file_read['new'] = false;
    //clear table
    table = [];
    $('#outputtable tbody').html('');
    $('#tabcwarning').hide();
    $('#menu-hide-undefined').prop('checked', false).checkboxradio( "refresh" );
    $('#menu-hide-undefined').checkboxradio("disable");
}

//insert/update table entry
function update_table(type, object, variable, value) {
    //check if row in table exists
    let rowupdated = false;
    for (let row of table) {
        if ((row.obj == object)
        && (row.var == variable)) {
            //update array
            row[type] = value;
            //prevent also pushing new row
            rowupdated = true;
            break;
        }
    };
    //push new row
    if (rowupdated == false) {
        //append array
        table.push({
            id: table.length,
            obj: object,
            var: variable,
            [type]: value
        });
    }
}

function read_pdump(type, pdump) { 
    //let initialtablelength = table.length;
    let matches = pdump.matchAll(/([A-Z]+) ([A-Za-z0-9_ ]+): (-?\d+(\/[a-z]{2,3})?)\s?/g);
    matches = Array.from(matches);
    //example result:
    //0: "PRM prio2fc48: 123/ct\n"
    //​1: "PRM"
    //​2: "prio2fc48"
    //​3: "123/ct"
    //​​4: "/ct"
    //set if content is read
    if (matches.length > 0) {
        file_read[type] = true;
        //read into table
        matches.forEach((item) => {
            update_table(type, item[1], item[2], item[3]);
        });
    }
    else {
        file_read[type] = false;
        //might be CCOL tab.c
        //cache fc names
        //FC_code[fc68] = "68";
        var fc = [];
        matches = pdump.matchAll(/FC_code\[([A-Za-z0-9_]+)\]\s*=\s*"([A-Za-z0-9._]+)"\s*;/g);
        for (const match of matches) {
            fc[match[1]] = match[2];
            file_read[type] = true;
            $('#tabcwarning').show();
        }
        if (file_read[type] == false) {
            //not ccol, do not continue
            return;
        }
        //cache d names
        //D_code[d021]        = "021";
        var d = [];
        matches = pdump.matchAll(/D_code\[([A-Za-z0-9_]+)\]\s*=\s*"([A-Za-z0-9._]+)"\s*;/g);
        for (const match of matches) {
            d[match[1]] = match[2];
        }
        //TO
        //TO_max[fc02][fc31] = 30;
        matches = pdump.matchAll(/(TO|TIG)_max\[([A-Za-z0-9_]+)\]\[([A-Za-z0-9_]+)\]\s*=\s*([0-9]+|NK|FK|GK|GKL)\s*;/g);
        for (const match of matches) {
            let postfix = '';
            switch (match[4]) {
                case 'NK':
                    match[4] = -1;
                    break;
                case 'FK':
                    match[4] = -2;
                    break;
                case 'GK':
                    match[4] = -3;
                    break;
                case 'GKL':
                    match[4] = -4;
                    break;
                default:
                    postfix = '/te';
            }
            update_table(type, match[1], fc[match[2]] + ' ' + fc[match[3]], match[4] + postfix);
        }
        //TDB, TDH, TBG, TOG
        //TDB_max[d021]        = 0;
        //TDH_max[d021]        = 20;
        //TBG_max[d021]        = 60;
        //TOG_max[d021]        = 720;
        matches = pdump.matchAll(/(TDB|TDH|TBG|TOG)_max\[([A-Za-z0-9_]+)\]\s*=\s*([0-9]+)\s*;/g);
        for (const match of matches) {
            let postfix = '';
            postfix = ((match[1] == 'TBG') || (match[1] == 'TOG')) ? '/tm' : '/te';
            update_table(type, match[1], d[match[2]], match[3] + postfix);
        }
        //TRG, TGG, TGL, TFG, TVG
        //TRG_max[fc02] = 20;
        //TGG_max[fc02] = 50;
        //TGL_max[fc02] = 30;
        //TFG_max[fc02] = 60;
        //TVG_max[fc02] = NG;
        matches = pdump.matchAll(/(TRG|TGG|TGL|TFG|TVG)_max\[([A-Za-z0-9_]+)\]\s*=\s*([0-9]+|NG)\s*;/g);
        for (const match of matches) {
            let postfix = '';
            if (match[3] != 'NG') {
                postfix = '/te';
            }
            update_table(type, match[1], fc[match[2]], match[3] + postfix);
        }
        //SCH
        //SCH_code[schca02]             = "CA02";             SCH[schca02]             = 0;
        matches = pdump.matchAll(/SCH_code\[.+\]\s*=\s*"([A-Za-z0-9._]+)"\s*;\s*SCH\[.+\]\s*=\s*(0|1)\s*;/g);
        for (const match of matches) {
            update_table(type, 'SCH', match[1], match[2] + '/sw');
        }
        //T, C, PRM
        //T_code[tkm02]       = "KM02";       T_max[tkm02]       = 80;   T_type[tkm02]       = TE_type;
        //C_code[cvc02] = "VC02"; C_max[cvc02] = 999;  C_type[cvc02] = CT_type+RO_type;
        //PRM_code[prmfb]               = "FB";               PRM[prmfb]               = 300;  PRM_type[prmfb]               = TS_type;
        matches = pdump.matchAll(/(T|C|PRM)_code\[.+\]\s*=\s*"([A-Za-z0-9._]+)"\s*;.+=\s*([0-9]+)\s*;\s*.{1,3}_type\[.+\]\s*=\s*(([A-Z]+)_type.*|0)\s*;/g);
        //console.log(Array.from(matches));
        for (const match of matches) {
            let postfix = '';
            if (match[4] != 0) {
                postfix = '/' + match[5].toLowerCase();
            }
            update_table(type, match[1], match[2], match[3] + postfix);
        }

        //LOGTYPE, MONTYPE
        //LOGTYPE[LOGTYPE_DATI] = 1;
        //MONTYPE[MONTYPE_DATI] = 1;
        
        matches = pdump.matchAll(/(LOG|MON)TYPE\[.{3}TYPE_(.+)]\s*=\s*([0-9]+)\s*;/g);
        for (const match of matches) {
            update_table(type, match[1] + 'TYPE', match[2], match[3] + '/ct');
        }
        //LOGPRM, MONPRM
        //LOGPRM[LOGPRM_EVENT] = 6;
        //MONPRM[MONPRM_EVENT] = 6;
        matches = pdump.matchAll(/(LOG|MON)PRM\[.{3}PRM_(.+)]\s*=\s*(.+)\s*;/g);
        for (const match of matches) {
            update_table(type, match[1] + 'PRM', match[2], match[3]);
        }
        //MONDP
        //MONDP_def   = 1;
        var match;
        if (match = pdump.match(/MONDP_def\s*=\s*([0-9]+)\s*;/)) {
            for (const i of Object.keys(d)) {
                update_table(type, 'MONDP', d[i], match[1] + '/ct');
            }
        }
        //MONFC
        //MONFC_def   = 255;
        if (match = pdump.match(/MONFC_def\s*=\s*([0-9]+)\s*;/)) {
            for (const i of Object.keys(fc)) {
                update_table(type, 'MONFC', fc[i], match[1] + '/ct');
            }
        }
        //MONIS
        //MONIS_def   = 15;
        //IS_code[isfix]          = "FIX";
        let monis;
        if (monis = pdump.match(/MONIS_def\s*=\s*([0-9]+)\s*;/)) {
            matches = pdump.matchAll(/IS_code\[.+]\s*=\s*"([A-Za-z0-9._]+)"\s*;/g);
            for (const match of matches) {
                update_table(type, 'MONIS', match[1], monis[1] + '/ct');
            }
        }
        //MONUS
        //MONUS_def   = 1;
        let monus;
        if (monus = pdump.match(/MONUS_def\s*=\s*([0-9]+)\s*;/)) {
            matches = pdump.matchAll(/US_code\[.+]\s*=\s*"([A-Za-z0-9._]+)"\s*;/g);
            for (const match of matches) {
                update_table(type, 'MONUS', match[1], monus[1] + '/ct');
            }
        }
        //unsupported
        //MONDS
        //MONDS_def   = 1
        //unsupported        
    }
    
    //update table row classes
    /*if (initialtablelength > 0) {
        setTimeout(function() { setLoadingScreen('Gegevens verwerken...'); }, 10);
        setTimeout(function() { setRowClasses(); }, 200);
        setTimeout(function() { setLoadingScreen(null); }, 300);
    }*/
    //output table to user
    if (file_read[type] == true) {
        populateTable();
    }
}

/*
* Set table contents
*/
function populateTable() {
    //only when both old and new file have been read
    if ((file_read['old'] == true) && (file_read['new'] == true)) {
        for (let i = 0; i < table.length; i++) {
            if (table[i].old !== table[i].new)
            $('#outputtable tbody').append('<tr' + (((typeof table[i].old == 'undefined') || (typeof table[i].new == 'undefined')) ? ' class="undef"' : '') + '><td>' + table[i].obj + '</td><td>' + table[i].var + '</td><td>' + table[i].old + '</td><td>' + table[i].new + '</td></tr>');

        }
        $('#menu-hide-undefined').checkboxradio("enable");
    }
}

/*
* Show/hide undefined rows
*/
function hideShowUndefined(state) {
    if (state == true) {
        $('#outputtable tbody tr.undef').hide();
    }
    else {
        $('#outputtable tbody tr.undef').show();
    }
}

/*
* Parse table and set classes according to value content
*
function setRowClasses() {
    //loop table rows
    $('#outputtable tbody > tr').each(function(index, tr) {
        //get values
        let oldval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(2)').html();
        let newval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(3)').html();
        
        //check if there is a difference and mark it
        if ((oldval == '') && (newval == '')) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-empty');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('leeg');
        }
        else if (oldval == newval) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-eq');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('nee');
        }
        else if (oldval != newval) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-neq');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('ja');
        }
        else {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-err');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('fout');
        }
    });
}*/

/*
* document ready
*/
$(function() {
    /*
    * editable comment field
    *
    $('#outputtable tbody').on('click', 'td:nth-child(6)', function() {
        //check if there is an input and if not add it
        if (!$(this).children('input').length) {
            //add input
            $(this).html('<input type="text" value="' + $(this).text() + '">');
            $('#outputtable tbody').on('blur', 'input', function() {
                //for some reason this is called twice
                if ($(this).parents('tr').index() >= 0) {
                    //update table
                    if ($(this).val().length > 0) {
                        //insert new value
                        table[($(this).parents('tr').index())].comment = $(this).val();
                    }
                    else {
                        //remove property from object if empty, as to not have empty values in the output
                        delete table[($(this).parents('tr').index())].comment;
                    }
                    //remove input
                    $(this).parent().text($(this).val());
                }
            });
        }
        //set focus
        $(this).children('input').focus();
    });*/
});

 /*
 * load saved file
 *
 function loadSavedFile (json) {
    //clear table
    newButtonClickHandle();
    //import
    try {
        let res = JSON.parse(json);
        res.forEach((item) => {
            //append array
            table.push({
                id: table.length,
                obj: item.obj,
                var: item.var,
                ...(typeof item.old !== 'undefined') && {old: item.old},
                ...(typeof item.new !== 'undefined') && {new: item.new},
                ...(typeof item.comment !== 'undefined') && {comment: item.comment}
            });
            //append html table
            $('#outputtable tbody').append('<tr><td>' + item.obj + '</td><td>' + item.var + '</td><td>' + ((typeof item.old !== 'undefined') ? item.old : '') + '</td><td>' + ((typeof item.new !== 'undefined') ? item.new : '') + '</td><td></td><td>' + ((typeof item.comment !== 'undefined') ? item.comment : '') + '</td></tr>');
        });
    } 
    catch (e) {
        console.log(e);
        return false;
    }
    return true;
}*/